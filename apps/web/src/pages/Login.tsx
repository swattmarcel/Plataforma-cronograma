import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiErrorMessage } from "../lib/api";
import { Button, Card, Input } from "../components/ui";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, senha);
      navigate("/");
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível entrar"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-teal-800 px-4">
      <Card className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-3xl mb-1">🐦</div>
          <h1 className="text-lg font-bold text-slate-800">Plataforma Criadouro</h1>
          <p className="text-sm text-slate-500">Gestão completa do seu criatório</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-3">
          <Input label="E-mail" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="Senha" type="password" required value={senha} onChange={(e) => setSenha(e.target.value)} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
        <p className="text-center text-sm text-slate-500 mt-4">
          Ainda não tem conta?{" "}
          <Link to="/registrar" className="text-teal-700 font-semibold">
            Criar criatório
          </Link>
        </p>
      </Card>
    </div>
  );
}
