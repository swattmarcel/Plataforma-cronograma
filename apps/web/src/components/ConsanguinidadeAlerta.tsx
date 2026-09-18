import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

interface ConsanguinidadeResult {
  coeficiente: number;
  percentual: number;
  nivel: "baixo" | "moderado" | "alto" | "critico";
}

const nivelInfo: Record<string, { label: string; classes: string; icon: string }> = {
  baixo: { label: "Consanguinidade baixa", classes: "bg-green-50 text-green-700 border-green-200", icon: "✅" },
  moderado: { label: "Consanguinidade moderada", classes: "bg-amber-50 text-amber-700 border-amber-200", icon: "⚠️" },
  alto: { label: "Consanguinidade alta", classes: "bg-orange-50 text-orange-700 border-orange-200", icon: "⚠️" },
  critico: { label: "Consanguinidade crítica — não recomendado", classes: "bg-red-50 text-red-700 border-red-200", icon: "🚫" },
};

export function ConsanguinidadeAlerta({ paiId, maeId }: { paiId: string; maeId: string }) {
  const { data, isLoading } = useQuery<ConsanguinidadeResult>({
    queryKey: ["consanguinidade", paiId, maeId],
    queryFn: async () => (await api.post("/animais/consanguinidade", { paiId, maeId })).data,
  });

  if (isLoading) return <p className="text-xs text-slate-400">Calculando consanguinidade...</p>;
  if (!data) return null;

  const info = nivelInfo[data.nivel];

  return (
    <div className={`rounded-xl border px-3 py-2 text-sm flex items-center justify-between gap-2 ${info.classes}`}>
      <span>
        {info.icon} {info.label}
      </span>
      <span className="font-bold">{data.percentual}%</span>
    </div>
  );
}
