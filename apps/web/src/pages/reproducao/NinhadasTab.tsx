import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiErrorMessage } from "../../lib/api";
import type { Casal, Ninhada } from "../../types";
import { Badge, Button, Card, EmptyState, Input, Select, Spinner } from "../../components/ui";

const statusOvoColor: Record<string, "amber" | "green" | "slate" | "blue" | "red"> = {
  AGUARDANDO: "amber",
  GALADO: "green",
  BRANCO: "slate",
  ECLODIU: "blue",
  FALHOU: "red",
};

export function NinhadasTab() {
  const queryClient = useQueryClient();
  const [casalId, setCasalId] = useState("");
  const [dataCruza, setDataCruza] = useState("");
  const [dataPostura, setDataPostura] = useState("");
  const [diasIncubacao, setDiasIncubacao] = useState(21);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const { data: casais } = useQuery<Casal[]>({
    queryKey: ["casais"],
    queryFn: async () => (await api.get("/reproducao/casais")).data,
  });

  const { data: ninhadas, isLoading } = useQuery<Ninhada[]>({
    queryKey: ["ninhadas"],
    queryFn: async () => (await api.get("/reproducao/ninhadas")).data,
  });

  const criar = useMutation({
    mutationFn: async () =>
      api.post("/reproducao/ninhadas", {
        casalId,
        dataCruza: dataCruza || undefined,
        dataPostura: dataPostura || undefined,
        diasIncubacao,
      }),
    onSuccess: () => {
      setCasalId("");
      setDataCruza("");
      setDataPostura("");
      setError("");
      queryClient.invalidateQueries({ queryKey: ["ninhadas"] });
    },
    onError: (err) => setError(apiErrorMessage(err, "Não foi possível registrar a ninhada")),
  });

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <h2 className="font-semibold text-slate-800">Registrar nova postura</h2>
        <Select label="Casal" value={casalId} onChange={(e) => setCasalId(e.target.value)}>
          <option value="">Selecione um casal</option>
          {(casais ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.macho.nome} × {c.femea.nome}
            </option>
          ))}
        </Select>
        <div className="grid grid-cols-2 gap-2">
          <Input label="Data da cruza" type="date" value={dataCruza} onChange={(e) => setDataCruza(e.target.value)} />
          <Input label="Data da postura" type="date" value={dataPostura} onChange={(e) => setDataPostura(e.target.value)} />
        </div>
        <Input
          label="Dias de incubação"
          type="number"
          min={1}
          value={diasIncubacao}
          onChange={(e) => setDiasIncubacao(Number(e.target.value))}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button className="w-full" disabled={!casalId || criar.isPending} onClick={() => criar.mutate()}>
          {criar.isPending ? "Registrando..." : "Registrar ninhada"}
        </Button>
      </Card>

      {isLoading ? (
        <Spinner />
      ) : !ninhadas || ninhadas.length === 0 ? (
        <EmptyState text="Nenhuma ninhada registrada ainda." />
      ) : (
        <div className="space-y-2">
          {ninhadas.map((n) => (
            <NinhadaCard key={n.id} ninhada={n} expanded={expandedId === n.id} onToggle={() => setExpandedId(expandedId === n.id ? null : n.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function NinhadaCard({ ninhada, expanded, onToggle }: { ninhada: Ninhada; expanded: boolean; onToggle: () => void }) {
  const queryClient = useQueryClient();
  const galados = ninhada.ovos.filter((o) => o.status === "GALADO" || o.status === "ECLODIU").length;
  const brancos = ninhada.ovos.filter((o) => o.status === "BRANCO").length;

  const addOvo = useMutation({
    mutationFn: async () =>
      api.post(`/reproducao/ninhadas/${ninhada.id}/ovos`, {
        numero: ninhada.ovos.length + 1,
        dataPostura: ninhada.dataPostura,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ninhadas"] }),
  });

  const updateOvo = useMutation({
    mutationFn: async ({ ovoId, status }: { ovoId: string; status: string }) => api.put(`/reproducao/ovos/${ovoId}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ninhadas"] }),
  });

  const finalizar = useMutation({
    mutationFn: async () => api.put(`/reproducao/ninhadas/${ninhada.id}`, { status: "FINALIZADA" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["ninhadas"] }),
  });

  return (
    <Card className="!p-3">
      <button onClick={onToggle} className="w-full text-left">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-slate-800">
              {ninhada.casal.macho.nome} × {ninhada.casal.femea.nome}
            </p>
            <p className="text-xs text-slate-500">
              {ninhada.ovos.length} ovo(s) • {galados} galado(s) • {brancos} branco(s)
              {ninhada.previsaoEclosao && ` • prev. ${new Date(ninhada.previsaoEclosao).toLocaleDateString("pt-BR")}`}
            </p>
          </div>
          <Badge color={ninhada.status === "EM_ANDAMENTO" ? "amber" : "green"}>
            {ninhada.status === "EM_ANDAMENTO" ? "Em andamento" : "Finalizada"}
          </Badge>
        </div>
      </button>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
          {ninhada.ovos.map((ovo) => (
            <div key={ovo.id} className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Ovo #{ovo.numero}</span>
              <select
                value={ovo.status}
                onChange={(e) => updateOvo.mutate({ ovoId: ovo.id, status: e.target.value })}
                className="text-xs rounded-lg border border-slate-200 px-2 py-1"
              >
                <option value="AGUARDANDO">Aguardando</option>
                <option value="GALADO">Galado (fértil)</option>
                <option value="BRANCO">Branco (infértil)</option>
                <option value="ECLODIU">Eclodiu</option>
                <option value="FALHOU">Falhou</option>
              </select>
              <Badge color={statusOvoColor[ovo.status]}>{ovo.status}</Badge>
            </div>
          ))}
          <div className="flex gap-2 pt-1">
            <Button variant="secondary" onClick={() => addOvo.mutate()} disabled={addOvo.isPending}>
              + Ovo
            </Button>
            {ninhada.status === "EM_ANDAMENTO" && (
              <Button variant="ghost" onClick={() => finalizar.mutate()} disabled={finalizar.isPending}>
                Finalizar ninhada
              </Button>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
