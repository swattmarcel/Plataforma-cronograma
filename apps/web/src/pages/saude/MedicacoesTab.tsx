import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiErrorMessage } from "../../lib/api";
import type { Animal, Medicacao } from "../../types";
import { Badge, Button, Card, EmptyState, Input, Select, Spinner } from "../../components/ui";

export function MedicacoesTab() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [animalId, setAnimalId] = useState("");
  const [medicamento, setMedicamento] = useState("");
  const [dose, setDose] = useState("");
  const [horarios, setHorarios] = useState<string[]>(["08:00"]);
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().slice(0, 10));
  const [whatsappAtivo, setWhatsappAtivo] = useState(false);
  const [error, setError] = useState("");

  const { data: medicacoes, isLoading } = useQuery<Medicacao[]>({
    queryKey: ["medicacoes"],
    queryFn: async () => (await api.get("/saude/medicacoes")).data,
  });
  const { data: animais } = useQuery<Animal[]>({
    queryKey: ["animais", "picker"],
    queryFn: async () => (await api.get("/animais")).data,
  });

  const criar = useMutation({
    mutationFn: async () =>
      api.post("/saude/medicacoes", { animalId, medicamento, dose: dose || undefined, horarios, dataInicio, whatsappAtivo }),
    onSuccess: () => {
      setMedicamento("");
      setDose("");
      setHorarios(["08:00"]);
      setAnimalId("");
      setWhatsappAtivo(false);
      setShowForm(false);
      setError("");
      queryClient.invalidateQueries({ queryKey: ["medicacoes"] });
    },
    onError: (err) => setError(apiErrorMessage(err, "Não foi possível salvar a medicação")),
  });

  const alternarAtiva = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => api.put(`/saude/medicacoes/${id}`, { ativo }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["medicacoes"] }),
  });

  const remover = useMutation({
    mutationFn: async (id: string) => api.delete(`/saude/medicacoes/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["medicacoes"] }),
  });

  function atualizarHorario(idx: number, valor: string) {
    setHorarios((h) => h.map((x, i) => (i === idx ? valor : x)));
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowForm((s) => !s)} className="!px-3 !py-2 text-sm">
          {showForm ? "Fechar" : "+ Medicação"}
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
            <Input label="Medicamento" value={medicamento} onChange={(e) => setMedicamento(e.target.value)} />
            <Input label="Dose" value={dose} onChange={(e) => setDose(e.target.value)} />
          </div>
          <Input label="Data de início" type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />

          <div>
            <span className="block mb-1 text-sm font-medium text-slate-600">Horários</span>
            <div className="space-y-1">
              {horarios.map((h, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    type="time"
                    value={h}
                    onChange={(e) => atualizarHorario(i, e.target.value)}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm flex-1"
                  />
                  {horarios.length > 1 && (
                    <button type="button" onClick={() => setHorarios((hs) => hs.filter((_, idx) => idx !== i))} className="text-xs text-red-600">
                      remover
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setHorarios((hs) => [...hs, "08:00"])}
              className="text-xs font-semibold text-teal-700 mt-1"
            >
              + horário
            </button>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={whatsappAtivo} onChange={(e) => setWhatsappAtivo(e.target.checked)} />
            Enviar lembrete pelo WhatsApp cadastrado (5 min antes do horário)
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button className="w-full" disabled={!animalId || !medicamento || criar.isPending} onClick={() => criar.mutate()}>
            {criar.isPending ? "Salvando..." : "Salvar medicação"}
          </Button>
        </Card>
      )}

      {isLoading ? (
        <Spinner />
      ) : !medicacoes || medicacoes.length === 0 ? (
        <EmptyState text="Nenhuma medicação cadastrada." />
      ) : (
        <div className="space-y-2">
          {medicacoes.map((m) => (
            <Card key={m.id} className={`!p-3 space-y-1 ${!m.ativo ? "opacity-50" : ""}`}>
              <div className="flex items-center justify-between">
                <p className="font-medium text-slate-800">
                  {m.medicamento}
                  {m.animal ? ` — ${m.animal.nome}` : ""}
                </p>
                {m.whatsappAtivo && <Badge color="green">WhatsApp ativo</Badge>}
              </div>
              <p className="text-xs text-slate-500">
                {m.dose ? `${m.dose} • ` : ""}
                Horários: {m.horarios.join(", ")}
              </p>
              <div className="flex gap-3 pt-1">
                <button onClick={() => alternarAtiva.mutate({ id: m.id, ativo: !m.ativo })} className="text-xs font-semibold text-teal-700">
                  {m.ativo ? "Pausar" : "Reativar"}
                </button>
                <button onClick={() => remover.mutate(m.id)} className="text-xs text-red-600 font-semibold">
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
