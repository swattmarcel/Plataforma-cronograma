import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { Card, EmptyState, Spinner } from "../../components/ui";

interface Resumo {
  animalId: string;
  nome: string;
  totalNinhadas: number;
  totalOvos: number;
  totalGalados: number;
  totalEclodidos: number;
  taxaFertilidade: number;
  taxaEclosao: number;
}

export function EstatisticasTab() {
  const { data, isLoading } = useQuery<{ machos: Resumo[]; femeas: Resumo[] }>({
    queryKey: ["reproducao-estatisticas"],
    queryFn: async () => (await api.get("/reproducao/estatisticas")).data,
  });

  if (isLoading || !data) return <Spinner />;

  const nenhum = data.machos.length === 0 && data.femeas.length === 0;
  if (nenhum) return <EmptyState text="Ainda não há dados suficientes de reprodução." />;

  return (
    <div className="space-y-4">
      <ResumoLista titulo="Melhores machos reprodutores" itens={data.machos} />
      <ResumoLista titulo="Melhores fêmeas reprodutoras" itens={data.femeas} />
    </div>
  );
}

function ResumoLista({ titulo, itens }: { titulo: string; itens: Resumo[] }) {
  if (itens.length === 0) return null;
  return (
    <Card>
      <h2 className="font-semibold text-slate-800 mb-3">{titulo}</h2>
      <div className="space-y-3">
        {itens.map((r) => (
          <div key={r.animalId}>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium text-slate-700">{r.nome}</span>
              <span className="text-slate-500">
                {r.totalNinhadas} ninhada(s) • {r.totalOvos} ovo(s)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-teal-600" style={{ width: `${r.taxaEclosao}%` }} />
              </div>
              <span className="text-xs font-semibold text-teal-700 w-16 text-right">{r.taxaEclosao}% eclosão</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
