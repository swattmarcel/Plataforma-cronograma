import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { authMiddleware } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { notFound } from "../../utils/httpError";

export const clientesRouter = Router();
clientesRouter.use(authMiddleware);

const clienteSchema = z.object({
  nome: z.string().min(1),
  cpfCnpj: z.string().optional().nullable(),
  endereco: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal("")),
  observacoes: z.string().optional().nullable(),
});

clientesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { q } = req.query as Record<string, string | undefined>;
    const clientes = await prisma.cliente.findMany({
      where: {
        criatorioId: req.auth!.criatorioId,
        ...(q
          ? {
              OR: [
                { nome: { contains: q, mode: "insensitive" } },
                { whatsapp: { contains: q, mode: "insensitive" } },
                { cpfCnpj: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: { _count: { select: { vendas: true } } },
      orderBy: { nome: "asc" },
    });
    res.json(clientes);
  })
);

clientesRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const cliente = await prisma.cliente.findFirst({
      where: { id: req.params.id, criatorioId: req.auth!.criatorioId },
      include: { vendas: { include: { animal: { select: { id: true, nome: true } } } } },
    });
    if (!cliente) throw notFound("Cliente não encontrado");
    res.json(cliente);
  })
);

clientesRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = clienteSchema.parse(req.body);
    const cliente = await prisma.cliente.create({ data: { ...data, criatorioId: req.auth!.criatorioId } });
    res.status(201).json(cliente);
  })
);

clientesRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const existing = await prisma.cliente.findFirst({
      where: { id: req.params.id, criatorioId: req.auth!.criatorioId },
    });
    if (!existing) throw notFound("Cliente não encontrado");
    const data = clienteSchema.partial().parse(req.body);
    const cliente = await prisma.cliente.update({ where: { id: req.params.id }, data });
    res.json(cliente);
  })
);

clientesRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const existing = await prisma.cliente.findFirst({
      where: { id: req.params.id, criatorioId: req.auth!.criatorioId },
    });
    if (!existing) throw notFound("Cliente não encontrado");
    await prisma.cliente.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);
