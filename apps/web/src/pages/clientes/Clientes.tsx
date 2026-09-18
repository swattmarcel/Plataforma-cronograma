import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiErrorMessage } from "../../lib/api";
import type { Cliente } from "../../types";
import { Button, Card, EmptyState, Input, PageTitle, Spinner } from "../../components/ui";

export default function Clientes() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nome: "", cpfCnpj: "", whatsapp: "", email: "", endereco: "" });
  const [error, setError] = useState("");

  const { data: clientes, isLoading } = useQuery<Cliente[]>({
    queryKey: ["clientes"],
    queryFn: async () => (await api.get("/clientes")).data,
  });

  const criar = useMutation({
    mutationFn: async () => api.post("/clientes", form),
    onSuccess: () => {
      setForm({ nome: "", cpfCnpj: "", whatsapp: "", email: "", endereco: "" });
      setShowForm(false);
      setError("");
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
    },
    onError: (err) => setError(apiErrorMessage(err, "Não foi possível salvar o cliente")),
  });

  const remover = useMutation({
    mutationFn: async (id: string) => api.delete(`/clientes/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clientes"] }),
  });

  return (
    <div className="space-y-4">
      <PageTitle
        title="Clientes"
        subtitle="Cadastro de compradores"
        action={
          <Button onClick={() => setShowForm((s) => !s)} className="!px-3 !py-2 text-sm">
            {showForm ? "Fechar" : "+ Cliente"}
          </Button>
        }
      />

      {showForm && (
        <Card className="space-y-3">
          <Input label="Nome *" required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <Input label="CPF/CNPJ" value={form.cpfCnpj} onChange={(e) => setForm({ ...form, cpfCnpj: e.target.value })} />
            <Input label="WhatsApp" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
          </div>
          <Input label="E-mail" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Endereço" value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button className="w-full" disabled={!form.nome || criar.isPending} onClick={() => criar.mutate()}>
            {criar.isPending ? "Salvando..." : "Salvar cliente"}
          </Button>
        </Card>
      )}

      {isLoading ? (
        <Spinner />
      ) : !clientes || clientes.length === 0 ? (
        <EmptyState text="Nenhum cliente cadastrado ainda." />
      ) : (
        <div className="space-y-2">
          {clientes.map((c) => (
            <Card key={c.id} className="!p-3 flex items-center justify-between">
              <div className="min-w-0">
                <p className="font-medium text-slate-800 truncate">{c.nome}</p>
                <p className="text-xs text-slate-500 truncate">
                  {c.whatsapp ?? "sem contato"} • {c._count?.vendas ?? 0} compra(s)
                </p>
              </div>
              <button onClick={() => confirm("Remover este cliente?") && remover.mutate(c.id)} className="text-xs text-red-600 font-semibold flex-shrink-0">
                remover
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
