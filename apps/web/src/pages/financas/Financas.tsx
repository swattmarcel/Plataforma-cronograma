import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiErrorMessage } from "../../lib/api";
import type { Financa } from "../../types";
import { Badge, Button, Card, EmptyState, Input, PageTitle, Select, Spinner } from "../../components/ui";

interface Resumo {
  receitas: number;
  despesas: number;
  lucroLiquido: number;
  custoPorAnimal: number;
}

const categorias = ["Ração", "Veterinário", "Anilhas/Microchip", "Licenças", "Energia elétrica", "Medicamentos", "Venda de filhote", "Outros"];

function money(v: number | string) {
  return Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function Financas() {
  const queryClient = useQueryClient();
  const [tipo, setTipo] = useState<"RECEITA" | "DESPESA">("DESPESA");
  const [categoria, setCategoria] = useState(categorias[0]);
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const { data: resumo } = useQuery<Resumo>({
    queryKey: ["financas-resumo"],
    queryFn: async () => (await api.get("/financas/resumo")).data,
  });

  const { data: lancamentos, isLoading } = useQuery<Financa[]>({
    queryKey: ["financas"],
    queryFn: async () => (await api.get("/financas")).data,
  });

  const criar = useMutation({
    mutationFn: async () => api.post("/financas", { tipo, categoria, descricao: descricao || undefined, valor: Number(valor), data }),
    onSuccess: () => {
      setDescricao("");
      setValor("");
      setError("");
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["financas"] });
      queryClient.invalidateQueries({ queryKey: ["financas-resumo"] });
    },
    onError: (err) => setError(apiErrorMessage(err, "Não foi possível salvar o lançamento")),
  });

  const remover = useMutation({
    mutationFn: async (id: string) => api.delete(`/financas/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financas"] });
      queryClient.invalidateQueries({ queryKey: ["financas-resumo"] });
    },
  });

  return (
    <div className="space-y-4">
      <PageTitle
        title="Financeiro"
        subtitle="Receitas, despesas e custo por animal"
        action={
          <Button onClick={() => setShowForm((s) => !s)} className="!px-3 !py-2 text-sm">
            {showForm ? "Fechar" : "+ Lançamento"}
          </Button>
        }
      />

      {resumo && (
        <div className="grid grid-cols-2 gap-2">
          <Card className="!p-3">
            <div className="text-[11px] text-slate-500">Receitas</div>
            <div className="text-lg font-bold text-green-600">{money(resumo.receitas)}</div>
          </Card>
          <Card className="!p-3">
            <div className="text-[11px] text-slate-500">Despesas</div>
            <div className="text-lg font-bold text-red-600">{money(resumo.despesas)}</div>
          </Card>
          <Card className="!p-3">
            <div className="text-[11px] text-slate-500">Lucro líquido</div>
            <div className={`text-lg font-bold ${resumo.lucroLiquido >= 0 ? "text-teal-700" : "text-red-600"}`}>{money(resumo.lucroLiquido)}</div>
          </Card>
          <Card className="!p-3">
            <div className="text-[11px] text-slate-500">Custo por animal</div>
            <div className="text-lg font-bold text-slate-700">{money(resumo.custoPorAnimal)}</div>
          </Card>
        </div>
      )}

      {showForm && (
        <Card className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Select label="Tipo" value={tipo} onChange={(e) => setTipo(e.target.value as "RECEITA" | "DESPESA")}>
              <option value="DESPESA">Despesa</option>
              <option value="RECEITA">Receita</option>
            </Select>
            <Select label="Categoria" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
              {categorias.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input label="Valor (R$)" type="number" min={0} step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} />
            <Input label="Data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </div>
          <Input label="Descrição" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button className="w-full" disabled={!valor || criar.isPending} onClick={() => criar.mutate()}>
            {criar.isPending ? "Salvando..." : "Salvar lançamento"}
          </Button>
        </Card>
      )}

      {isLoading ? (
        <Spinner />
      ) : !lancamentos || lancamentos.length === 0 ? (
        <EmptyState text="Nenhum lançamento registrado ainda." />
      ) : (
        <div className="space-y-2">
          {lancamentos.map((l) => (
            <Card key={l.id} className="!p-3 flex items-center justify-between">
              <div className="min-w-0">
                <p className="font-medium text-slate-800 truncate">{l.categoria}</p>
                <p className="text-xs text-slate-500">
                  {new Date(l.data).toLocaleDateString("pt-BR")}
                  {l.descricao ? ` • ${l.descricao}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge color={l.tipo === "RECEITA" ? "green" : "red"}>{l.tipo === "RECEITA" ? "+" : "-"} {money(l.valor)}</Badge>
                <button onClick={() => remover.mutate(l.id)} className="text-xs text-slate-400">
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
