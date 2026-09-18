import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiErrorMessage } from "../lib/api";
import { Button, Card, Input } from "../components/ui";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [criatorioNome, setCriatorioNome] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(nome, email, senha, criatorioNome);
      navigate("/");
    } catch (err) {
      setError(apiErrorMessage(err, "Não foi possível criar a conta"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-teal-800 px-4 py-8">
      <Card className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-3xl mb-1">🐦</div>
          <h1 className="text-lg font-bold text-slate-800">Crie seu criatório digital</h1>
          <p className="text-sm text-slate-500">Substitua planilhas e cadernos de anotações</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-3">
          <Input label="Seu nome" required value={nome} onChange={(e) => setNome(e.target.value)} />
          <Input label="Nome do criatório" required value={criatorioNome} onChange={(e) => setCriatorioNome(e.target.value)} />
          <Input label="E-mail" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input
            label="Senha"
            type="password"
            required
            minLength={6}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Criando..." : "Criar conta grátis"}
          </Button>
        </form>
        <p className="text-center text-sm text-slate-500 mt-4">
          Já tem conta?{" "}
          <Link to="/login" className="text-teal-700 font-semibold">
            Entrar
          </Link>
        </p>
      </Card>
    </div>
  );
}
