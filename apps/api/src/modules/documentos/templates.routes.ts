import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { authMiddleware } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { notFound } from "../../utils/httpError";
import { upload, saveUploadedFile } from "../../utils/upload";

export const documentoTemplatesRouter = Router();
documentoTemplatesRouter.use(authMiddleware);

const templateSchema = z.object({
  nome: z.string().min(1),
  tipo: z.enum(["CERTIFICADO_ORIGEM", "CRACHA"]),
  corPrimaria: z.string().default("#0f766e"),
  corFundo: z.string().default("#ffffff"),
  corTexto: z.string().default("#111827"),
  fonte: z.enum(["helvetica", "times", "courier"]).default("helvetica"),
  mostrarLogo: z.boolean().default(true),
  mostrarQr: z.boolean().default(true),
  mostrarRegistrosLegais: z.boolean().default(true),
  padrao: z.boolean().default(false),
});

documentoTemplatesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { tipo } = req.query as Record<string, string | undefined>;
    const templates = await prisma.documentoTemplate.findMany({
      where: { criatorioId: req.auth!.criatorioId, ...(tipo ? { tipo: tipo as any } : {}) },
      orderBy: [{ padrao: "desc" }, { createdAt: "desc" }],
    });
    res.json(templates);
  })
);

documentoTemplatesRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = templateSchema.parse(req.body);
    const criatorioId = req.auth!.criatorioId;

    if (data.padrao) {
      await prisma.documentoTemplate.updateMany({
        where: { criatorioId, tipo: data.tipo },
        data: { padrao: false },
      });
    }

    const template = await prisma.documentoTemplate.create({ data: { ...data, criatorioId } });
    res.status(201).json(template);
  })
);

documentoTemplatesRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const criatorioId = req.auth!.criatorioId;
    const existing = await prisma.documentoTemplate.findFirst({ where: { id: req.params.id, criatorioId } });
    if (!existing) throw notFound("Modelo não encontrado");

    const data = templateSchema.partial().parse(req.body);
    if (data.padrao) {
      await prisma.documentoTemplate.updateMany({
        where: { criatorioId, tipo: existing.tipo, id: { not: existing.id } },
        data: { padrao: false },
      });
    }

    const template = await prisma.documentoTemplate.update({ where: { id: req.params.id }, data });
    res.json(template);
  })
);

documentoTemplatesRouter.post(
  "/:id/background",
  upload.single("background"),
  asyncHandler(async (req, res) => {
    const existing = await prisma.documentoTemplate.findFirst({
      where: { id: req.params.id, criatorioId: req.auth!.criatorioId },
    });
    if (!existing) throw notFound("Modelo não encontrado");
    if (!req.file) return res.status(400).json({ error: "Arquivo não enviado" });

    const template = await prisma.documentoTemplate.update({
      where: { id: req.params.id },
      data: { backgroundUrl: await saveUploadedFile(req.file) },
    });
    res.json(template);
  })
);

documentoTemplatesRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const existing = await prisma.documentoTemplate.findFirst({
      where: { id: req.params.id, criatorioId: req.auth!.criatorioId },
    });
    if (!existing) throw notFound("Modelo não encontrado");
    await prisma.documentoTemplate.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);
