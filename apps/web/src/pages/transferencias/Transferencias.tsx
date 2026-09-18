import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiErrorMessage } from "../../lib/api";
import type { Animal, TransferenciaCodigo } from "../../types";
import { Badge, Button, Card, EmptyState, Input, PageTitle, Select, Spinner } from "../../components/ui";

export default function Transferencias() {
  const queryClient = useQueryClient();

  const { data: codigos, isLoading: carregandoCodigos } = useQuery<TransferenciaCodigo[]>({
    queryKey: ["transferencias-codigos"],
    queryFn: async () => (await api.get("/transferencias/codigos")).data,
  });
  const { data: recebidas } = useQuery<TransferenciaCodigo[]>({
    queryKey: ["transferencias-recebidas"],
    queryFn: async () => (await api.get("/transferencias/recebidas")).data,
  });
  const { data: enviadas } = useQuery<TransferenciaCodigo[]>({
    queryKey: ["transferencias-enviadas"],
    queryFn: async () => (await api.get("/transferencias/enviadas")).data,
  });
  const { data: animais } = useQuery<Animal[]>({
    queryKey: ["animais", "picker"],
    queryFn: async () => (await api.get("/animais")).data,
  });

  const gerarCodigo = useMutation({
    mutationFn: async () => api.post("/transferencias/gerar-codigo"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["transferencias-codigos"] }),
  });

  const cancelarCodigo = useMutation({
    mutationFn: async (id: string) => api.delete(`/transferencias/codigos/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["transferencias-codigos"] }),
  });

  const [codigoInput, setCodigoInput] = useState("");
  const [animalId, setAnimalId] = useState("");
  const [error, setError] = useState("");
  const [sucesso, setSucesso] = useState("");

  const confirmar = useMutation({
    mutationFn: async () => api.post("/transferencias/confirmar", { codigo: codigoInput, animalId }),
    onSuccess: () => {
      setSucesso(`Ave transferida com sucesso!`);
      setError("");
      setCodigoInput("");
      setAnimalId("");
      queryClient.invalidateQueries({ queryKey: ["animais"] });
      queryClient.invalidateQueries({ queryKey: ["transferencias-enviadas"] });
    },
    onError: (err) => setError(apiErrorMessage(err, "Não foi possível confirmar a transferência")),
  });

  const codigosAtivos = (codigos ?? []).filter((c) => c.status === "ATIVO");

  return (
    <div className="space-y-4">
      <PageTitle title="Transferências" subtitle="Envie ou receba aves com genealogia, saúde e competições" />

      <Card className="space-y-3">
        <h2 className="font-semibold text-slate-800">1. Vou receber uma ave</h2>
        <p className="text-xs text-slate-500 -mt-2">
          Gere um código temporário e compartilhe com quem vai transferir a ave para o seu criatório.
        </p>
        <Button onClick={() => gerarCodigo.mutate()} disabled={gerarCodigo.isPending} variant="secondary" className="w-full">
          {gerarCodigo.isPending ? "Gerando..." : "Gerar novo código"}
        </Button>

        {carregandoCodigos ? (
          <Spinner />
        ) : (
          codigosAtivos.length > 0 && (
            <div className="space-y-2 pt-1">
              {codigosAtivos.map((c) => (
                <div key={c.id} className="flex items-center justify-between bg-teal-50 rounded-xl px-3 py-2">
                  <div>
                    <p className="font-mono font-bold text-teal-800 text-lg tracking-wider">{c.codigo}</p>
                    <p className="text-[11px] text-slate-500">válido até {new Date(c.expiraEm).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <button onClick={() => cancelarCodigo.mutate(c.id)} className="text-xs text-red-600 font-semibold">
                    cancelar
                  </button>
                </div>
              ))}
            </div>
          )
        )}
      </Card>

      <Card className="space-y-3">
        <h2 className="font-semibold text-slate-800">2. Vou transferir uma ave</h2>
        <p className="text-xs text-slate-500 -mt-2">Informe o código recebido e escolha a ave do seu plantel.</p>
        <Input
          label="Código"
          value={codigoInput}
          onChange={(e) => setCodigoInput(e.target.value.toUpperCase())}
          placeholder="Ex: AB12CD34"
        />
        <Select label="Ave" value={animalId} onChange={(e) => setAnimalId(e.target.value)}>
          <option value="">Selecione</option>
          {(animais ?? []).map((a) => (
            <option key={a.id} value={a.id}>
              {a.nome}
            </option>
          ))}
        </Select>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {sucesso && <p className="text-sm text-green-600">{sucesso}</p>}
        <Button className="w-full" disabled={!codigoInput || !animalId || confirmar.isPending} onClick={() => confirmar.mutate()}>
          {confirmar.isPending ? "Confirmando..." : "Confirmar transferência"}
        </Button>
      </Card>

      <Card>
        <h2 className="font-semibold text-slate-800 mb-2">Recebidas</h2>
        {!recebidas || recebidas.length === 0 ? (
          <EmptyState text="Nenhuma ave recebida por transferência ainda." />
        ) : (
          <div className="space-y-2">
            {recebidas.map((r) => (
              <div key={r.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-700">{r.animal?.nome}</span>
                <Badge color="green">de {r.origemCriatorioNome ?? "outro criatório"}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h2 className="font-semibold text-slate-800 mb-2">Enviadas</h2>
        {!enviadas || enviadas.length === 0 ? (
          <EmptyState text="Nenhuma ave enviada por transferência ainda." />
        ) : (
          <div className="space-y-2">
            {enviadas.map((e) => (
              <div key={e.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-700">{e.animal?.nome}</span>
                <Badge color="blue">para {e.criatorio?.nome ?? "outro criatório"}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
