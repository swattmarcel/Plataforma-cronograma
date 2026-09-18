import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { authMiddleware } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { upload, publicUrlFor } from "../../utils/upload";

export const criatoriosRouter = Router();
criatoriosRouter.use(authMiddleware);

criatoriosRouter.get(
  "/me",
  asyncHandler(async (req, res) => {
    const criatorio = await prisma.criatorio.findUnique({ where: { id: req.auth!.criatorioId } });
    res.json(criatorio);
  })
);

const updateSchema = z.object({
  nome: z.string().min(2).optional(),
  corMacho: z.string().optional(),
  corFemea: z.string().optional(),
  registroIbama: z.string().optional().nullable(),
  registroClube: z.string().optional().nullable(),
  registroFederacao: z.string().optional().nullable(),
  cidade: z.string().optional().nullable(),
  uf: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
});

criatoriosRouter.put(
  "/me",
  asyncHandler(async (req, res) => {
    const data = updateSchema.parse(req.body);
    const criatorio = await prisma.criatorio.update({
      where: { id: req.auth!.criatorioId },
      data,
    });
    res.json(criatorio);
  })
);

criatoriosRouter.post(
  "/me/logo",
  upload.single("logo"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "Arquivo de logo não enviado" });
    }
    const logoUrl = publicUrlFor(req.file.filename);
    const criatorio = await prisma.criatorio.update({
      where: { id: req.auth!.criatorioId },
      data: { logoUrl },
    });
    res.json(criatorio);
  })
);
