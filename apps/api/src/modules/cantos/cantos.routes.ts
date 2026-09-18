import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { authMiddleware } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { badRequest, notFound } from "../../utils/httpError";

export const cantosRouter = Router();
cantosRouter.use(authMiddleware);

const sessaoSchema = z.object({
  animalId: z.string().uuid(),
  modo: z.enum(["AUTOMATICO", "MANUAL"]),
  quantidadeCantos: z.number().int().nonnegative(),
  duracaoSegundos: z.number().int().nonnegative(),
  data: z.coerce.date().optional(),
  observacoes: z.string().optional().nullable(),
});

cantosRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { animalId } = req.query as Record<string, string | undefined>;
    const sessoes = await prisma.sessaoCanto.findMany({
      where: { criatorioId: req.auth!.criatorioId, ...(animalId ? { animalId } : {}) },
      include: { animal: { select: { id: true, nome: true } } },
      orderBy: { data: "desc" },
      take: 100,
    });
    res.json(sessoes);
  })
);

cantosRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = sessaoSchema.parse(req.body);
    const criatorioId = req.auth!.criatorioId;
    const animal = await prisma.animal.findFirst({ where: { id: data.animalId, criatorioId } });
    if (!animal) throw badRequest("Animal não encontrado");

    const sessao = await prisma.sessaoCanto.create({ data: { ...data, criatorioId } });
    res.status(201).json(sessao);
  })
);

cantosRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const existing = await prisma.sessaoCanto.findFirst({
      where: { id: req.params.id, criatorioId: req.auth!.criatorioId },
    });
    if (!existing) throw notFound("Sessão não encontrada");
    await prisma.sessaoCanto.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);
