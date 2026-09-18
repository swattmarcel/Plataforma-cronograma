import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { authMiddleware } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { notFound } from "../../utils/httpError";

export const financasRouter = Router();
financasRouter.use(authMiddleware);

const financaSchema = z.object({
  tipo: z.enum(["RECEITA", "DESPESA"]),
  categoria: z.string().min(1),
  descricao: z.string().optional().nullable(),
  valor: z.number().positive(),
  data: z.coerce.date(),
  animalId: z.string().uuid().optional().nullable(),
});

financasRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { tipo, de, ate, animalId } = req.query as Record<string, string | undefined>;
    const lancamentos = await prisma.financa.findMany({
      where: {
        criatorioId: req.auth!.criatorioId,
        ...(tipo ? { tipo: tipo as any } : {}),
        ...(animalId ? { animalId } : {}),
        ...(de || ate
          ? {
              data: {
                ...(de ? { gte: new Date(de) } : {}),
                ...(ate ? { lte: new Date(ate) } : {}),
              },
            }
          : {}),
      },
      include: { animal: { select: { id: true, nome: true } } },
      orderBy: { data: "desc" },
    });
    res.json(lancamentos);
  })
);

financasRouter.get(
  "/resumo",
  asyncHandler(async (req, res) => {
    const criatorioId = req.auth!.criatorioId;
    const lancamentos = await prisma.financa.findMany({ where: { criatorioId } });
    const receitas = lancamentos.filter((l) => l.tipo === "RECEITA").reduce((acc, l) => acc + Number(l.valor), 0);
    const despesas = lancamentos.filter((l) => l.tipo === "DESPESA").reduce((acc, l) => acc + Number(l.valor), 0);

    const totalAnimais = await prisma.animal.count({ where: { criatorioId } });
    const custoPorAnimal = totalAnimais > 0 ? despesas / totalAnimais : 0;

    res.json({
      receitas: Number(receitas.toFixed(2)),
      despesas: Number(despesas.toFixed(2)),
      lucroLiquido: Number((receitas - despesas).toFixed(2)),
      custoPorAnimal: Number(custoPorAnimal.toFixed(2)),
    });
  })
);

financasRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = financaSchema.parse(req.body);
    const lancamento = await prisma.financa.create({
      data: { ...data, criatorioId: req.auth!.criatorioId },
    });
    res.status(201).json(lancamento);
  })
);

financasRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const existing = await prisma.financa.findFirst({
      where: { id: req.params.id, criatorioId: req.auth!.criatorioId },
    });
    if (!existing) throw notFound("Lançamento não encontrado");
    const data = financaSchema.partial().parse(req.body);
    const lancamento = await prisma.financa.update({ where: { id: req.params.id }, data });
    res.json(lancamento);
  })
);

financasRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const existing = await prisma.financa.findFirst({
      where: { id: req.params.id, criatorioId: req.auth!.criatorioId },
    });
    if (!existing) throw notFound("Lançamento não encontrado");
    await prisma.financa.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);
