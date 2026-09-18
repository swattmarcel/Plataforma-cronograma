import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiErrorMessage } from "../../lib/api";
import type { Animal, Casal } from "../../types";
import { Button, Card, EmptyState, Select, Spinner } from "../../components/ui";
import { ConsanguinidadeAlerta } from "../../components/ConsanguinidadeAlerta";

export function CasaisTab() {
  const queryClient = useQueryClient();
  const [machoId, setMachoId] = useState("");
  const [femeaId, setFemeaId] = useState("");
  const [error, setError] = useState("");

  const { data: casais, isLoading } = useQuery<Casal[]>({
    queryKey: ["casais"],
    queryFn: async () => (await api.get("/reproducao/casais")).data,
  });

  const { data: animais } = useQuery<Animal[]>({
    queryKey: ["animais", "picker"],
    queryFn: async () => (await api.get("/animais")).data,
  });

  const machos = (animais ?? []).filter((a) => a.sexo === "MACHO");
  const femeas = (animais ?? []).filter((a) => a.sexo === "FEMEA");

  const criar = useMutation({
    mutationFn: async () => api.post("/reproducao/casais", { machoId, femeaId }),
    onSuccess: () => {
      setMachoId("");
      setFemeaId("");
      setError("");
      queryClient.invalidateQueries({ queryKey: ["casais"] });
    },
    onError: (err) => setError(apiErrorMessage(err, "Não foi possível formar o casal")),
  });

  const remover = useMutation({
    mutationFn: async (id: string) => api.delete(`/reproducao/casais/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["casais"] }),
  });

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <h2 className="font-semibold text-slate-800">Formar novo casal</h2>
        <div className="grid grid-cols-2 gap-2">
          <Select label="Macho" value={machoId} onChange={(e) => setMachoId(e.target.value)}>
            <option value="">Selecione</option>
            {machos.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nome}
              </option>
            ))}
          </Select>
          <Select label="Fêmea" value={femeaId} onChange={(e) => setFemeaId(e.target.value)}>
            <option value="">Selecione</option>
            {femeas.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome}
              </option>
            ))}
          </Select>
        </div>
        {machoId && femeaId && <ConsanguinidadeAlerta paiId={machoId} maeId={femeaId} />}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button className="w-full" disabled={!machoId || !femeaId || criar.isPending} onClick={() => criar.mutate()}>
          {criar.isPending ? "Formando casal..." : "Formar casal"}
        </Button>
      </Card>

      {isLoading ? (
        <Spinner />
      ) : !casais || casais.length === 0 ? (
        <EmptyState text="Nenhum casal formado ainda." />
      ) : (
        <div className="space-y-2">
          {casais.map((c) => (
            <Card key={c.id} className="!p-3 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800">
                  {c.macho.nome} × {c.femea.nome}
                </p>
                <p className="text-xs text-slate-500">
                  {c._count?.ninhadas ?? 0} ninhada(s)
                  {c.coeficienteConsanguinidade != null && c.coeficienteConsanguinidade > 0 && (
                    <span className="text-amber-600"> • consang. {(c.coeficienteConsanguinidade * 100).toFixed(1)}%</span>
                  )}
                </p>
              </div>
              <button onClick={() => remover.mutate(c.id)} className="text-xs text-red-600 font-semibold">
                remover
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
