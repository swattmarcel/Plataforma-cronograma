import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api";
import type { Animal, SessaoCanto } from "../../types";
import { Badge, Button, Card, EmptyState, PageTitle, Select, Spinner } from "../../components/ui";

function formatDuracao(segundos: number) {
  const m = Math.floor(segundos / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(segundos % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

export default function Cantos() {
  const queryClient = useQueryClient();
  const [animalId, setAnimalId] = useState("");
  const [modo, setModo] = useState<"MANUAL" | "AUTOMATICO">("MANUAL");
  const [rodando, setRodando] = useState(false);
  const [contagem, setContagem] = useState(0);
  const [duracao, setDuracao] = useState(0);
  const [nivelAudio, setNivelAudio] = useState(0);
  const [erroMic, setErroMic] = useState("");

  const timerRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const ultimoPicoRef = useRef(0);

  const { data: animais } = useQuery<Animal[]>({
    queryKey: ["animais", "picker"],
    queryFn: async () => (await api.get("/animais")).data,
  });
  const { data: sessoes, isLoading } = useQuery<SessaoCanto[]>({
    queryKey: ["cantos"],
    queryFn: async () => (await api.get("/cantos")).data,
  });

  const salvar = useMutation({
    mutationFn: async () =>
      api.post("/cantos", { animalId, modo, quantidadeCantos: contagem, duracaoSegundos: duracao }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cantos"] });
      setContagem(0);
      setDuracao(0);
    },
  });

  const remover = useMutation({
    mutationFn: async (id: string) => api.delete(`/cantos/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cantos"] }),
  });

  useEffect(() => {
    if (!rodando) return;
    timerRef.current = window.setInterval(() => setDuracao((d) => d + 1), 1000);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [rodando]);

  async function iniciar() {
    setErroMic("");
    setContagem(0);
    setDuracao(0);
    setRodando(true);

    if (modo === "AUTOMATICO") {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        const ctx = new AudioContext();
        audioCtxRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        source.connect(analyser);
        analyserRef.current = analyser;

        const data = new Uint8Array(analyser.frequencyBinCount);
        const LIMIAR = 0.35;
        const DEBOUNCE_MS = 500;

        function loop() {
          analyser.getByteTimeDomainData(data);
          let somaQuadrados = 0;
          for (let i = 0; i < data.length; i++) {
            const v = (data[i] - 128) / 128;
            somaQuadrados += v * v;
          }
          const rms = Math.sqrt(somaQuadrados / data.length);
          setNivelAudio(rms);

          const agora = Date.now();
          if (rms > LIMIAR && agora - ultimoPicoRef.current > DEBOUNCE_MS) {
            ultimoPicoRef.current = agora;
            setContagem((c) => c + 1);
          }
          rafRef.current = requestAnimationFrame(loop);
        }
        loop();
      } catch {
        setErroMic("Não foi possível acessar o microfone. Use a contagem manual ou permita o acesso ao microfone.");
        setModo("MANUAL");
      }
    }
  }

  function parar() {
    setRodando(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    if (audioCtxRef.current) audioCtxRef.current.close();
    setNivelAudio(0);
  }

  useEffect(() => () => parar(), []);

  return (
    <div className="space-y-4">
      <PageTitle title="Contador de Cantos" subtitle="Automático (microfone) ou manual, com cronômetro e histórico" />

      <Card className="space-y-3">
        <Select label="Animal" value={animalId} onChange={(e) => setAnimalId(e.target.value)} disabled={rodando}>
          <option value="">Selecione</option>
          {(animais ?? []).map((a) => (
            <option key={a.id} value={a.id}>
              {a.nome}
            </option>
          ))}
        </Select>

        <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
          {(["MANUAL", "AUTOMATICO"] as const).map((m) => (
            <button
              key={m}
              disabled={rodando}
              onClick={() => setModo(m)}
              className={`flex-1 text-sm font-semibold rounded-lg py-1.5 ${modo === m ? "bg-white shadow text-teal-700" : "text-slate-500"}`}
            >
              {m === "MANUAL" ? "Manual" : "Automático"}
            </button>
          ))}
        </div>

        {erroMic && <p className="text-xs text-red-600">{erroMic}</p>}
        {modo === "AUTOMATICO" && (
          <p className="text-[11px] text-slate-400">
            Detecta picos de volume no microfone (não reconhece a espécie do canto). Ambientes silenciosos funcionam melhor.
          </p>
        )}

        <div className="text-center py-4">
          <div className="text-5xl font-bold text-teal-700 tabular-nums">{contagem}</div>
          <div className="text-sm text-slate-500 mt-1">cantos • {formatDuracao(duracao)}</div>
          {modo === "AUTOMATICO" && rodando && (
            <div className="mt-3 mx-auto h-2 w-40 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full bg-teal-500 transition-all" style={{ width: `${Math.min(100, nivelAudio * 200)}%` }} />
            </div>
          )}
        </div>

        {!rodando ? (
          <Button className="w-full" disabled={!animalId} onClick={iniciar}>
            Iniciar sessão
          </Button>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {modo === "MANUAL" && (
              <button
                onClick={() => setContagem((c) => c + 1)}
                className="col-span-2 bg-teal-700 text-white rounded-2xl py-6 text-lg font-bold active:scale-95 transition-transform"
              >
                Marcar canto
              </button>
            )}
            <Button variant="secondary" onClick={() => setContagem(0)}>
              Zerar
            </Button>
            <Button variant="danger" onClick={parar}>
              Parar
            </Button>
          </div>
        )}

        {!rodando && (duracao > 0 || contagem > 0) && (
          <Button variant="ghost" className="w-full" disabled={salvar.isPending} onClick={() => salvar.mutate()}>
            {salvar.isPending ? "Salvando..." : "Salvar sessão no histórico"}
          </Button>
        )}
      </Card>

      {isLoading ? (
        <Spinner />
      ) : !sessoes || sessoes.length === 0 ? (
        <EmptyState text="Nenhuma sessão registrada ainda." />
      ) : (
        <div className="space-y-2">
          {sessoes.map((s) => (
            <Card key={s.id} className="!p-3 flex items-center justify-between">
              <div>
                <p className="font-medium text-slate-800">{s.animal?.nome}</p>
                <p className="text-xs text-slate-500">
                  {new Date(s.data).toLocaleString("pt-BR")} • {formatDuracao(s.duracaoSegundos)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge color={s.modo === "AUTOMATICO" ? "teal" : "slate"}>{s.quantidadeCantos} cantos</Badge>
                <button onClick={() => remover.mutate(s.id)} className="text-xs text-slate-400">
                  ✕
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
