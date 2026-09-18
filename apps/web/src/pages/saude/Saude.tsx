import { useState } from "react";
import { PageTitle } from "../../components/ui";
import { RegistrosTab } from "./RegistrosTab";
import { MedicacoesTab } from "./MedicacoesTab";

const tabs = [
  { key: "registros", label: "Registros" },
  { key: "medicacoes", label: "Medicações" },
] as const;

type TabKey = (typeof tabs)[number]["key"];

export default function Saude() {
  const [tab, setTab] = useState<TabKey>("registros");

  return (
    <div className="space-y-4">
      <PageTitle title="Saúde" subtitle="Fichas de saúde e lembretes de medicação" />

      <div className="flex bg-white rounded-xl border border-slate-200 p-1 gap-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 text-sm font-semibold rounded-lg py-1.5 transition-colors ${
              tab === t.key ? "bg-teal-700 text-white" : "text-slate-500"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "registros" && <RegistrosTab />}
      {tab === "medicacoes" && <MedicacoesTab />}
    </div>
  );
}
