import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { Badge, Card, EmptyState, Spinner } from "../components/ui";
import { useAuth } from "../context/AuthContext";

interface DashboardData {
  plantel: { machos: number; femeas: number; filhotesNaoSexados: number; ativos: number; total: number };
  alertas: Array<{
    id: string;
    tipo: string;
    titulo: string;
    data: string;
    animal?: { id: string; nome: string } | null;
  }>;
  nascimentosPrevistos: Array<{ ninhadaId: string; casal: string; previsaoEclosao: string; qtdOvos: number }>;
}

const tipoLabel: Record<string, string> = {
  NASCIMENTO_PREVISTO: "Nascimento previsto",
  SEPARACAO_FILHOTES: "Separação de filhotes",
  VACINA: "Vacina",
  MEDICACAO: "Medicação",
  LICENCA: "Licença",
  OUTRO: "Lembrete",
};

const tipoColor: Record<string, "teal" | "amber" | "red" | "blue"> = {
  NASCIMENTO_PREVISTO: "teal",
  SEPARACAO_FILHOTES: "blue",
  VACINA: "amber",
  MEDICACAO: "amber",
  LICENCA: "red",
  OUTRO: "blue",
};

export default function Dashboard() {
  const { criatorio } = useAuth();
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: async () => (await api.get("/dashboard")).data,
  });

  if (isLoading || !data) return <Spinner />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Olá, {criatorio?.nome} 👋</h1>
        <p className="text-sm text-slate-500">Resumo do seu plantel hoje</p>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <StatMini label="Total" value={data.plantel.total} />
        <StatMini label="Machos" value={data.plantel.machos} color="text-blue-600" />
        <StatMini label="Fêmeas" value={data.plantel.femeas} color="text-pink-600" />
        <StatMini label="Filhotes" value={data.plantel.filhotesNaoSexados} color="text-amber-600" />
      </div>

      <Card>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-slate-800">Nascimentos previstos</h2>
          <Link to="/reproducao" className="text-xs text-teal-700 font-semibold">
            ver tudo
          </Link>
        </div>
        {data.nascimentosPrevistos.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhuma ninhada em andamento no momento.</p>
        ) : (
          <ul className="space-y-2">
            {data.nascimentosPrevistos.map((n) => (
              <li key={n.ninhadaId} className="flex items-center justify-between text-sm">
                <span className="text-slate-700">{n.casal}</span>
                <span className="text-slate-500">
                  {n.qtdOvos} ovo(s) • prev. {new Date(n.previsaoEclosao).toLocaleDateString("pt-BR")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h2 className="font-semibold text-slate-800 mb-2">Alertas e lembretes (30 dias)</h2>
        {data.alertas.length === 0 ? (
          <EmptyState text="Nenhum alerta pendente. Tudo em dia! ✅" />
        ) : (
          <ul className="space-y-2">
            {data.alertas.map((a) => (
              <li key={a.id} className="flex items-center justify-between text-sm gap-2">
                <div className="min-w-0">
                  <p className="text-slate-700 truncate">
                    {a.titulo}
                    {a.animal ? ` — ${a.animal.nome}` : ""}
                  </p>
                  <p className="text-xs text-slate-400">{new Date(a.data).toLocaleDateString("pt-BR")}</p>
                </div>
                <Badge color={tipoColor[a.tipo] ?? "slate"}>{tipoLabel[a.tipo] ?? a.tipo}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Link to="/animais/novo" className="bg-teal-700 text-white rounded-2xl p-4 text-center font-semibold shadow-sm">
          + Novo animal
        </Link>
        <Link to="/reproducao" className="bg-white border border-slate-200 rounded-2xl p-4 text-center font-semibold text-slate-700 shadow-sm">
          Formar casal
        </Link>
      </div>
    </div>
  );
}

function StatMini({ label, value, color = "text-slate-800" }: { label: string; value: number; color?: string }) {
  return (
    <Card className="text-center !p-3">
      <div className={`text-xl font-bold ${color}`}>{value}</div>
      <div className="text-[11px] text-slate-500">{label}</div>
    </Card>
  );
}
