// Função serverless da Vercel: encaminha todas as requisições /api/* para o
// app Express definido em apps/api. Mantido na raiz do monorepo porque a
// Vercel detecta funções automaticamente a partir da pasta /api.
import type { IncomingMessage, ServerResponse } from "http";
import { app } from "../apps/api/src/app";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req: IncomingMessage, res: ServerResponse) {
  // As rotas do Express não têm o prefixo /api (ex.: /auth/login), então
  // removemos o prefixo antes de repassar a requisição.
  if (req.url) {
    req.url = req.url.replace(/^\/api/, "") || "/";
  }
  return (app as unknown as (req: IncomingMessage, res: ServerResponse) => void)(req, res);
}
