import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiErrorMessage } from "../../lib/api";
import type { Animal, Evento } from "../../types";
import { Badge, Button, Card, EmptyState, Input, PageTitle, Select, Spinner } from "../../components/ui";

const tipoLabel: Record<string, string> = {
  NASCIMENTO_PREVISTO: "Nascimento previsto",
  SEPARACAO_FILHOTES: "Separação de filhotes",
  VACINA: "Vacina",
  MEDICACAO: "Medicação",
  LICENCA: "Licença",
  OUTRO: "Outro",
};

export default function Lembretes() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [tipo, setTipo] = useState("VACINA");
  const [titulo, setTitulo] = useState("");
  const [data, setData] = useState("");
  const [animalId, setAnimalId] = useState("");
  const [error, setError] = useState("");

  const { data: eventos, isLoading } = useQuery<Evento[]>({
    queryKey: ["eventos"],
    queryFn: async () => (await api.get("/eventos")).data,
  });
  const { data: animais } = useQuery<Animal[]>({
    queryKey: ["animais", "picker"],
    queryFn: async () => (await api.get("/animais")).data,
  });

  const criar = useMutation({
    mutationFn: async () => api.post("/eventos", { tipo, titulo, data, animalId: animalId || undefined }),
    onSuccess: () => {
      setTitulo("");
      setData("");
      setAnimalId("");
      setShowForm(false);
      setError("");
      queryClient.invalidateQueries({ queryKey: ["eventos"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err) => setError(apiErrorMessage(err, "Não foi possível salvar o lembrete")),
  });

  const concluir = useMutation({
    mutationFn: async (id: string) => api.put(`/eventos/${id}`, { concluido: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eventos"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  const remover = useMutation({
    mutationFn: async (id: string) => api.delete(`/eventos/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["eventos"] }),
  });

  return (
    <div className="space-y-4">
      <PageTitle
        title="Lembretes"
        subtitle="Vacinas, medicações e licenças"
        action={
          <Button onClick={() => setShowForm((s) => !s)} className="!px-3 !py-2 text-sm">
            {showForm ? "Fechar" : "+ Lembrete"}
          </Button>
        }
      />

      {showForm && (
        <Card className="space-y-3">
          <Select label="Tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            {Object.entries(tipoLabel).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Input label="Título" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          <Input label="Data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
          <Select label="Animal (opcional)" value={animalId} onChange={(e) => setAnimalId(e.target.value)}>
            <option value="">—</option>
            {(animais ?? []).map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome}
              </option>
            ))}
          </Select>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button className="w-full" disabled={!titulo || !data || criar.isPending} onClick={() => criar.mutate()}>
            {criar.isPending ? "Salvando..." : "Salvar lembrete"}
          </Button>
        </Card>
      )}

      {isLoading ? (
        <Spinner />
      ) : !eventos || eventos.length === 0 ? (
        <EmptyState text="Nenhum lembrete cadastrado." />
      ) : (
        <div className="space-y-2">
          {eventos.map((e) => (
            <Card key={e.id} className={`!p-3 flex items-center justify-between gap-2 ${e.concluido ? "opacity-50" : ""}`}>
              <div className="min-w-0">
                <p className="font-medium text-slate-800 truncate">
                  {e.titulo}
                  {e.animal ? ` — ${e.animal.nome}` : ""}
                </p>
                <p className="text-xs text-slate-500">{new Date(e.data).toLocaleDateString("pt-BR")}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge>{tipoLabel[e.tipo] ?? e.tipo}</Badge>
                {!e.concluido && (
                  <button onClick={() => concluir.mutate(e.id)} className="text-xs text-teal-700 font-semibold">
                    concluir
                  </button>
                )}
                <button onClick={() => remover.mutate(e.id)} className="text-xs text-slate-400">
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
