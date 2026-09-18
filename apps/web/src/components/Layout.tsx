import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/", label: "Início", icon: "🏠", end: true },
  { to: "/animais", label: "Plantel", icon: "🐾" },
  { to: "/reproducao", label: "Reprodução", icon: "🥚" },
  { to: "/financas", label: "Financeiro", icon: "💰" },
  { to: "/documentos", label: "Docs", icon: "📄" },
  { to: "/mais", label: "Mais", icon: "⋯" },
];

export function Layout() {
  const { criatorio, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="sticky top-0 z-20 bg-teal-800 text-white shadow-sm">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            {criatorio?.logoUrl ? (
              <img src={criatorio.logoUrl} alt="Logo" className="h-8 w-8 rounded-full object-cover bg-white" />
            ) : (
              <span className="text-xl">🐦</span>
            )}
            <span className="font-semibold truncate">{criatorio?.nome ?? "Meu Criatório"}</span>
          </div>
          <button
            onClick={logout}
            className="text-xs bg-teal-700 hover:bg-teal-600 px-3 py-1.5 rounded-full transition-colors"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-3xl px-4 pb-24 pt-4">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 inset-x-0 z-20 bg-white border-t border-slate-200 pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto max-w-3xl grid grid-cols-6">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium ${
                  isActive ? "text-teal-700" : "text-slate-500"
                }`
              }
            >
              <span className="text-lg leading-none">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
