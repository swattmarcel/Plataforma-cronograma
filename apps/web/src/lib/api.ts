import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "/api",
});

const TOKEN_KEY = "criadouro_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function apiErrorMessage(err: unknown, fallback = "Ocorreu um erro. Tente novamente."): string {
  if (axios.isAxiosError(err)) {
    return (err.response?.data as { error?: string } | undefined)?.error ?? fallback;
  }
  return fallback;
}

/**
 * Resolve uma URL de arquivo retornada pela API: absolutas (Vercel Blob em
 * produção) são usadas como estão; relativas (/uploads/... em dev local)
 * ganham o prefixo da API.
 */
export function resolveFileUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  return `${api.defaults.baseURL}${url}`;
}
