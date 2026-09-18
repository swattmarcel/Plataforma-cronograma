import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { authMiddleware } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { notFound } from "../../utils/httpError";

export const eventosRouter = Router();
eventosRouter.use(authMiddleware);

const eventoSchema = z.object({
  tipo: z.enum(["NASCIMENTO_PREVISTO", "SEPARACAO_FILHOTES", "VACINA", "MEDICACAO", "LICENCA", "OUTRO"]),
  titulo: z.string().min(1),
  data: z.coerce.date(),
  animalId: z.string().uuid().optional().nullable(),
  observacoes: z.string().optional().nullable(),
  concluido: z.boolean().optional(),
});

eventosRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { concluido } = req.query as Record<string, string | undefined>;
    const eventos = await prisma.evento.findMany({
      where: {
        criatorioId: req.auth!.criatorioId,
        ...(concluido !== undefined ? { concluido: concluido === "true" } : {}),
      },
      include: { animal: { select: { id: true, nome: true } } },
      orderBy: { data: "asc" },
    });
    res.json(eventos);
  })
);

eventosRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = eventoSchema.parse(req.body);
    const evento = await prisma.evento.create({ data: { ...data, criatorioId: req.auth!.criatorioId } });
    res.status(201).json(evento);
  })
);

eventosRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const existing = await prisma.evento.findFirst({
      where: { id: req.params.id, criatorioId: req.auth!.criatorioId },
    });
    if (!existing) throw notFound("Evento não encontrado");
    const data = eventoSchema.partial().parse(req.body);
    const evento = await prisma.evento.update({ where: { id: req.params.id }, data });
    res.json(evento);
  })
);

eventosRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const existing = await prisma.evento.findFirst({
      where: { id: req.params.id, criatorioId: req.auth!.criatorioId },
    });
    if (!existing) throw notFound("Evento não encontrado");
    await prisma.evento.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);
