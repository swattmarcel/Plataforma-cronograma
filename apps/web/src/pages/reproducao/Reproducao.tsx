import { useState } from "react";
import { PageTitle } from "../../components/ui";
import { CasaisTab } from "./CasaisTab";
import { NinhadasTab } from "./NinhadasTab";
import { EstatisticasTab } from "./EstatisticasTab";

const tabs = [
  { key: "casais", label: "Casais" },
  { key: "ninhadas", label: "Ninhadas" },
  { key: "estatisticas", label: "Estatísticas" },
] as const;

type TabKey = (typeof tabs)[number]["key"];

export default function Reproducao() {
  const [tab, setTab] = useState<TabKey>("casais");

  return (
    <div className="space-y-4">
      <PageTitle title="Reprodução" subtitle="Casais, posturas e estatísticas de reprodutores" />

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

      {tab === "casais" && <CasaisTab />}
      {tab === "ninhadas" && <NinhadasTab />}
      {tab === "estatisticas" && <EstatisticasTab />}
    </div>
  );
}
