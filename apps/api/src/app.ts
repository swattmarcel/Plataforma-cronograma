import express from "express";
import cors from "cors";
import { errorHandler } from "./middleware/errorHandler";
import { uploadsRootPath } from "./utils/upload";

import { authRouter } from "./modules/auth/auth.routes";
import { criatoriosRouter } from "./modules/criatorios/criatorios.routes";
import { animaisRouter } from "./modules/animais/animais.routes";
import { reproducaoRouter } from "./modules/reproducao/reproducao.routes";
import { financasRouter } from "./modules/financas/financas.routes";
import { clientesRouter } from "./modules/clientes/clientes.routes";
import { vendasRouter } from "./modules/vendas/vendas.routes";
import { documentosRouter } from "./modules/documentos/documentos.routes";
import { documentoTemplatesRouter } from "./modules/documentos/templates.routes";
import { eventosRouter } from "./modules/eventos/eventos.routes";
import { dashboardRouter } from "./modules/dashboard/dashboard.routes";
import { publicRouter } from "./modules/public/public.routes";
import { saudeRouter } from "./modules/saude/saude.routes";
import { competicoesRouter } from "./modules/competicoes/competicoes.routes";
import { cantosRouter } from "./modules/cantos/cantos.routes";
import { transferenciasRouter } from "./modules/transferencias/transferencias.routes";
import { importacaoRouter } from "./modules/importacao/importacao.routes";
import { internalRouter } from "./modules/internal/internal.routes";

export const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(uploadsRootPath));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/auth", authRouter);
app.use("/criatorios", criatoriosRouter);
app.use("/animais", animaisRouter);
app.use("/reproducao", reproducaoRouter);
app.use("/financas", financasRouter);
app.use("/clientes", clientesRouter);
app.use("/vendas", vendasRouter);
app.use("/documentos/templates", documentoTemplatesRouter);
app.use("/documentos", documentosRouter);
app.use("/eventos", eventosRouter);
app.use("/dashboard", dashboardRouter);
app.use("/public", publicRouter);
app.use("/saude", saudeRouter);
app.use("/competicoes", competicoesRouter);
app.use("/cantos", cantosRouter);
app.use("/transferencias", transferenciasRouter);
app.use("/importacao", importacaoRouter);
app.use("/internal", internalRouter);

app.use((_req, res) => res.status(404).json({ error: "Rota não encontrada" }));
app.use(errorHandler);
