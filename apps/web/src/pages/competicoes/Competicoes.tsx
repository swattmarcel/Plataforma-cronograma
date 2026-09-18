import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiErrorMessage } from "../../lib/api";
import type { Animal, Competicao } from "../../types";
import { Badge, Button, Card, EmptyState, Input, PageTitle, Select, Spinner, Textarea } from "../../components/ui";

export default function Competicoes() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [animalId, setAnimalId] = useState("");
  const [evento, setEvento] = useState("");
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [quantidadeCantos, setQuantidadeCantos] = useState("");
  const [colocacao, setColocacao] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [error, setError] = useState("");
  const [midiaUploadId, setMidiaUploadId] = useState<string | null>(null);

  const { data: competicoes, isLoading } = useQuery<Competicao[]>({
    queryKey: ["competicoes"],
    queryFn: async () => (await api.get("/competicoes")).data,
  });
  const { data: animais } = useQuery<Animal[]>({
    queryKey: ["animais", "picker"],
    queryFn: async () => (await api.get("/animais")).data,
  });

  const criar = useMutation({
    mutationFn: async () =>
      api.post("/competicoes", {
        animalId,
        evento,
        data,
        quantidadeCantos: quantidadeCantos ? Number(quantidadeCantos) : undefined,
        colocacao: colocacao || undefined,
        observacoes: observacoes || undefined,
      }),
    onSuccess: () => {
      setEvento("");
      setQuantidadeCantos("");
      setColocacao("");
      setObservacoes("");
      setAnimalId("");
      setShowForm(false);
      setError("");
      queryClient.invalidateQueries({ queryKey: ["competicoes"] });
    },
    onError: (err) => setError(apiErrorMessage(err, "Não foi possível salvar a competição")),
  });

  const remover = useMutation({
    mutationFn: async (id: string) => api.delete(`/competicoes/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["competicoes"] }),
  });

  const uploadMidia = useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const fd = new FormData();
      fd.append("midia", file);
      return api.post(`/competicoes/${id}/midia`, fd, { headers: { "Content-Type": "multipart/form-data" } });
    },
    onMutate: ({ id }) => setMidiaUploadId(id),
    onSettled: () => {
      setMidiaUploadId(null);
      queryClient.invalidateQueries({ queryKey: ["competicoes"] });
    },
  });

  return (
    <div className="space-y-4">
      <PageTitle
        title="Competições"
        subtitle="Histórico de campeonatos da sua ave"
        action={
          <Button onClick={() => setShowForm((s) => !s)} className="!px-3 !py-2 text-sm">
            {showForm ? "Fechar" : "+ Competição"}
          </Button>
        }
      />

      {showForm && (
        <Card className="space-y-3">
          <Select label="Animal" value={animalId} onChange={(e) => setAnimalId(e.target.value)}>
            <option value="">Selecione</option>
            {(animais ?? []).map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome}
              </option>
            ))}
          </Select>
          <Input label="Evento" value={evento} onChange={(e) => setEvento(e.target.value)} placeholder="Ex: Campeonato Regional" />
          <div className="grid grid-cols-3 gap-2">
            <Input label="Data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
            <Input label="Cantos" type="number" min={0} value={quantidadeCantos} onChange={(e) => setQuantidadeCantos(e.target.value)} />
            <Input label="Colocação" value={colocacao} onChange={(e) => setColocacao(e.target.value)} placeholder="2º" />
          </div>
          <Textarea label="Observações" rows={2} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button className="w-full" disabled={!animalId || !evento || criar.isPending} onClick={() => criar.mutate()}>
            {criar.isPending ? "Salvando..." : "Salvar competição"}
          </Button>
        </Card>
      )}

      {isLoading ? (
        <Spinner />
      ) : !competicoes || competicoes.length === 0 ? (
        <EmptyState text="Nenhuma competição registrada ainda." />
      ) : (
        <div className="space-y-2">
          {competicoes.map((c) => (
            <Card key={c.id} className="!p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-slate-800 truncate">
                    {c.evento}
                    {c.animal ? ` — ${c.animal.nome}` : ""}
                  </p>
                  <p className="text-xs text-slate-500">{new Date(c.data).toLocaleDateString("pt-BR")}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {c.quantidadeCantos != null && <Badge color="teal">{c.quantidadeCantos} cantos</Badge>}
                  {c.colocacao && <Badge color="amber">{c.colocacao}º</Badge>}
                </div>
              </div>
              {c.observacoes && <p className="text-xs text-slate-500">{c.observacoes}</p>}
              {c.midias.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {c.midias.map((m) => (
                    <a key={m} href={`${api.defaults.baseURL}${m}`} target="_blank" rel="noreferrer" className="text-xs text-teal-700 underline">
                      mídia
                    </a>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-3 pt-1">
                <label className="text-xs font-semibold text-teal-700 cursor-pointer">
                  {uploadMidia.isPending && midiaUploadId === c.id ? "Enviando..." : "+ áudio/vídeo"}
                  <input
                    type="file"
                    accept="audio/*,video/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadMidia.mutate({ id: c.id, file });
                      e.target.value = "";
                    }}
                  />
                </label>
                <button onClick={() => remover.mutate(c.id)} className="text-xs text-red-600 font-semibold">
                  remover
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
