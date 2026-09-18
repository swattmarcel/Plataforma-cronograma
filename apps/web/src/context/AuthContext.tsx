import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, getToken, setToken } from "../lib/api";
import type { Criatorio, User } from "../types";

interface AuthContextValue {
  user: User | null;
  criatorio: Criatorio | null;
  loading: boolean;
  login: (email: string, senha: string) => Promise<void>;
  register: (nome: string, email: string, senha: string, criatorioNome: string) => Promise<void>;
  logout: () => void;
  refreshCriatorio: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [criatorio, setCriatorio] = useState<Criatorio | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadMe() {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data.user);
      setCriatorio(data.criatorio);
    } catch {
      setToken(null);
      setUser(null);
      setCriatorio(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (getToken()) {
      loadMe();
    } else {
      setLoading(false);
    }
  }, []);

  async function login(email: string, senha: string) {
    const { data } = await api.post("/auth/login", { email, senha });
    setToken(data.token);
    setUser(data.user);
    setCriatorio(data.criatorio);
  }

  async function register(nome: string, email: string, senha: string, criatorioNome: string) {
    const { data } = await api.post("/auth/register", { nome, email, senha, criatorioNome });
    setToken(data.token);
    setUser(data.user);
    setCriatorio(data.criatorio);
  }

  function logout() {
    setToken(null);
    setUser(null);
    setCriatorio(null);
  }

  async function refreshCriatorio() {
    const { data } = await api.get("/criatorios/me");
    setCriatorio(data);
  }

  return (
    <AuthContext.Provider value={{ user, criatorio, loading, login, register, logout, refreshCriatorio }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de AuthProvider");
  return ctx;
}
