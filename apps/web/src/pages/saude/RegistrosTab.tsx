import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiErrorMessage } from "../../lib/api";
import type { Animal, RegistroSaude } from "../../types";
import { Badge, Button, Card, EmptyState, Input, Select, Spinner, Textarea } from "../../components/ui";

const tipoLabel: Record<string, string> = {
  DOENCA: "Doença",
  TRATAMENTO: "Tratamento",
  VACINA: "Vacina",
  OBSERVACAO: "Observação",
};

const tipoColor: Record<string, "red" | "amber" | "green" | "blue"> = {
  DOENCA: "red",
  TRATAMENTO: "amber",
  VACINA: "green",
  OBSERVACAO: "blue",
};

export function RegistrosTab() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [animalId, setAnimalId] = useState("");
  const [tipo, setTipo] = useState("OBSERVACAO");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState("");

  const { data: registros, isLoading } = useQuery<RegistroSaude[]>({
    queryKey: ["saude-registros"],
    queryFn: async () => (await api.get("/saude/registros")).data,
  });
  const { data: animais } = useQuery<Animal[]>({
    queryKey: ["animais", "picker"],
    queryFn: async () => (await api.get("/animais")).data,
  });

  const criar = useMutation({
    mutationFn: async () => api.post("/saude/registros", { animalId, tipo, titulo, descricao: descricao || undefined, data }),
    onSuccess: () => {
      setTitulo("");
      setDescricao("");
      setAnimalId("");
      setShowForm(false);
      setError("");
      queryClient.invalidateQueries({ queryKey: ["saude-registros"] });
    },
    onError: (err) => setError(apiErrorMessage(err, "Não foi possível salvar o registro")),
  });

  const remover = useMutation({
    mutationFn: async (id: string) => api.delete(`/saude/registros/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["saude-registros"] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowForm((s) => !s)} className="!px-3 !py-2 text-sm">
          {showForm ? "Fechar" : "+ Registro"}
        </Button>
      </div>

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
          <div className="grid grid-cols-2 gap-2">
            <Select label="Tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
              {Object.entries(tipoLabel).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
            <Input label="Data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </div>
          <Input label="Título" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          <Textarea label="Descrição" rows={3} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button className="w-full" disabled={!animalId || !titulo || criar.isPending} onClick={() => criar.mutate()}>
            {criar.isPending ? "Salvando..." : "Salvar registro"}
          </Button>
        </Card>
      )}

      {isLoading ? (
        <Spinner />
      ) : !registros || registros.length === 0 ? (
        <EmptyState text="Nenhum registro de saúde ainda." />
      ) : (
        <div className="space-y-2">
          {registros.map((r) => (
            <Card key={r.id} className="!p-3 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-slate-800 truncate">
                  {r.titulo}
                  {r.animal ? ` — ${r.animal.nome}` : ""}
                </p>
                <p className="text-xs text-slate-500">{new Date(r.data).toLocaleDateString("pt-BR")}</p>
                {r.descricao && <p className="text-xs text-slate-500 mt-1">{r.descricao}</p>}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge color={tipoColor[r.tipo]}>{tipoLabel[r.tipo]}</Badge>
                <button onClick={() => remover.mutate(r.id)} className="text-xs text-slate-400">
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
