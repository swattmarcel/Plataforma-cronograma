import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { authMiddleware } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { badRequest, notFound } from "../../utils/httpError";
import { saveUploadedFile, uploadMidia } from "../../utils/upload";

export const competicoesRouter = Router();
competicoesRouter.use(authMiddleware);

const competicaoSchema = z.object({
  animalId: z.string().uuid(),
  evento: z.string().min(1),
  data: z.coerce.date(),
  quantidadeCantos: z.number().int().nonnegative().optional().nullable(),
  colocacao: z.string().optional().nullable(),
  observacoes: z.string().optional().nullable(),
});

competicoesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { animalId } = req.query as Record<string, string | undefined>;
    const competicoes = await prisma.competicao.findMany({
      where: { criatorioId: req.auth!.criatorioId, ...(animalId ? { animalId } : {}) },
      include: { animal: { select: { id: true, nome: true } } },
      orderBy: { data: "desc" },
    });
    res.json(competicoes);
  })
);

competicoesRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = competicaoSchema.parse(req.body);
    const criatorioId = req.auth!.criatorioId;
    const animal = await prisma.animal.findFirst({ where: { id: data.animalId, criatorioId } });
    if (!animal) throw badRequest("Animal não encontrado");

    const competicao = await prisma.competicao.create({ data: { ...data, criatorioId, midias: [] } });
    res.status(201).json(competicao);
  })
);

competicoesRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const existing = await prisma.competicao.findFirst({
      where: { id: req.params.id, criatorioId: req.auth!.criatorioId },
    });
    if (!existing) throw notFound("Competição não encontrada");
    const data = competicaoSchema.partial().parse(req.body);
    const competicao = await prisma.competicao.update({ where: { id: req.params.id }, data });
    res.json(competicao);
  })
);

competicoesRouter.post(
  "/:id/midia",
  uploadMidia.single("midia"),
  asyncHandler(async (req, res) => {
    const existing = await prisma.competicao.findFirst({
      where: { id: req.params.id, criatorioId: req.auth!.criatorioId },
    });
    if (!existing) throw notFound("Competição não encontrada");
    if (!req.file) throw badRequest("Arquivo não enviado");

    const midiaUrl = await saveUploadedFile(req.file);
    const competicao = await prisma.competicao.update({
      where: { id: req.params.id },
      data: { midias: { push: midiaUrl } },
    });
    res.json(competicao);
  })
);

competicoesRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const existing = await prisma.competicao.findFirst({
      where: { id: req.params.id, criatorioId: req.auth!.criatorioId },
    });
    if (!existing) throw notFound("Competição não encontrada");
    await prisma.competicao.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);
