import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AnimaisList from "./pages/animais/AnimaisList";
import AnimalForm from "./pages/animais/AnimalForm";
import AnimalDetail from "./pages/animais/AnimalDetail";
import Reproducao from "./pages/reproducao/Reproducao";
import Financas from "./pages/financas/Financas";
import Clientes from "./pages/clientes/Clientes";
import Vendas from "./pages/vendas/Vendas";
import Documentos from "./pages/documentos/Documentos";
import Configuracoes from "./pages/configuracoes/Configuracoes";
import Lembretes from "./pages/eventos/Lembretes";
import Mais from "./pages/mais/Mais";
import PublicVerify from "./pages/PublicVerify";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/registrar" element={<Register />} />
      <Route path="/verificar/:codigo" element={<PublicVerify />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="/animais" element={<AnimaisList />} />
        <Route path="/animais/novo" element={<AnimalForm />} />
        <Route path="/animais/:id" element={<AnimalDetail />} />
        <Route path="/animais/:id/editar" element={<AnimalForm />} />
        <Route path="/reproducao" element={<Reproducao />} />
        <Route path="/financas" element={<Financas />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/vendas" element={<Vendas />} />
        <Route path="/documentos" element={<Documentos />} />
        <Route path="/configuracoes" element={<Configuracoes />} />
        <Route path="/lembretes" element={<Lembretes />} />
        <Route path="/mais" element={<Mais />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
