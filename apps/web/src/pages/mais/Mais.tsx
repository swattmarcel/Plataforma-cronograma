import { Link } from "react-router-dom";
import { PageTitle } from "../../components/ui";

const items = [
  { to: "/clientes", label: "Clientes (CRM)", icon: "👤", desc: "Cadastro de compradores" },
  { to: "/vendas", label: "Vendas & Reservas", icon: "🧾", desc: "Reservas, recibos e contratos" },
  { to: "/lembretes", label: "Lembretes", icon: "⏰", desc: "Vacinas, medicações e licenças" },
  { to: "/configuracoes", label: "Configurações", icon: "⚙️", desc: "Logo, cores e dados legais" },
];

export default function Mais() {
  return (
    <div className="space-y-4">
      <PageTitle title="Mais" />
      <div className="space-y-2">
        {items.map((item) => (
          <Link key={item.to} to={item.to} className="flex items-center gap-3 bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
            <span className="text-2xl">{item.icon}</span>
            <div>
              <p className="font-semibold text-slate-800">{item.label}</p>
              <p className="text-xs text-slate-500">{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
