import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiErrorMessage } from "../../lib/api";
import type { Animal, Cliente, Venda } from "../../types";
import { Badge, Button, Card, EmptyState, Input, PageTitle, Select, Spinner } from "../../components/ui";

const statusColor: Record<string, "amber" | "green" | "blue" | "red"> = {
  RESERVADO: "amber",
  PAGO: "green",
  ENTREGUE: "blue",
  CANCELADO: "red",
};

export default function Vendas() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [clienteId, setClienteId] = useState("");
  const [animalId, setAnimalId] = useState("");
  const [tipo, setTipo] = useState<"RESERVA" | "VENDA">("RESERVA");
  const [valor, setValor] = useState("");
  const [error, setError] = useState("");

  const { data: vendas, isLoading } = useQuery<Venda[]>({
    queryKey: ["vendas"],
    queryFn: async () => (await api.get("/vendas")).data,
  });
  const { data: clientes } = useQuery<Cliente[]>({
    queryKey: ["clientes"],
    queryFn: async () => (await api.get("/clientes")).data,
  });
  const { data: animais } = useQuery<Animal[]>({
    queryKey: ["animais", "picker"],
    queryFn: async () => (await api.get("/animais")).data,
  });
  const disponiveis = (animais ?? []).filter((a) => a.status === "ATIVO" || a.status === "RESERVADO");

  const criar = useMutation({
    mutationFn: async () => api.post("/vendas", { clienteId, animalId, tipo, valor: Number(valor) }),
    onSuccess: () => {
      setClienteId("");
      setAnimalId("");
      setValor("");
      setShowForm(false);
      setError("");
      queryClient.invalidateQueries({ queryKey: ["vendas"] });
      queryClient.invalidateQueries({ queryKey: ["animais"] });
    },
    onError: (err) => setError(apiErrorMessage(err, "Não foi possível registrar")),
  });

  const atualizarStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => api.put(`/vendas/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendas"] });
      queryClient.invalidateQueries({ queryKey: ["animais"] });
    },
  });

  return (
    <div className="space-y-4">
      <PageTitle
        title="Vendas & Reservas"
        subtitle="Reserve filhotes e gere recibo/contrato"
        action={
          <Button onClick={() => setShowForm((s) => !s)} className="!px-3 !py-2 text-sm">
            {showForm ? "Fechar" : "+ Nova"}
          </Button>
        }
      />

      {showForm && (
        <Card className="space-y-3">
          <Select label="Cliente" value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
            <option value="">Selecione</option>
            {(clientes ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </Select>
          <Select label="Animal" value={animalId} onChange={(e) => setAnimalId(e.target.value)}>
            <option value="">Selecione</option>
            {disponiveis.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome} ({a.especie})
              </option>
            ))}
          </Select>
          <div className="grid grid-cols-2 gap-2">
            <Select label="Tipo" value={tipo} onChange={(e) => setTipo(e.target.value as "RESERVA" | "VENDA")}>
              <option value="RESERVA">Reserva</option>
              <option value="VENDA">Venda direta</option>
            </Select>
            <Input label="Valor (R$)" type="number" min={0} step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button className="w-full" disabled={!clienteId || !animalId || !valor || criar.isPending} onClick={() => criar.mutate()}>
            {criar.isPending ? "Salvando..." : "Registrar"}
          </Button>
        </Card>
      )}

      {isLoading ? (
        <Spinner />
      ) : !vendas || vendas.length === 0 ? (
        <EmptyState text="Nenhuma venda ou reserva registrada ainda." />
      ) : (
        <div className="space-y-2">
          {vendas.map((v) => (
            <Card key={v.id} className="!p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-slate-800 truncate">
                    {v.animal.nome} → {v.cliente.nome}
                  </p>
                  <p className="text-xs text-slate-500">
                    {v.tipo === "RESERVA" ? "Reserva" : "Venda"} • {Number(v.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </p>
                </div>
                <Badge color={statusColor[v.status]}>{v.status}</Badge>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Select
                  value={v.status}
                  onChange={(e) => atualizarStatus.mutate({ id: v.id, status: e.target.value })}
                  className="!py-1 !px-2 text-xs w-auto"
                >
                  <option value="RESERVADO">Reservado</option>
                  <option value="PAGO">Pago</option>
                  <option value="ENTREGUE">Entregue</option>
                  <option value="CANCELADO">Cancelado</option>
                </Select>
                <a
                  href={`${api.defaults.baseURL}/vendas/${v.id}/recibo.pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-teal-700"
                >
                  Recibo
                </a>
                <a
                  href={`${api.defaults.baseURL}/vendas/${v.id}/contrato.pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-teal-700"
                >
                  Contrato
                </a>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
