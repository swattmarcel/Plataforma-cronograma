import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { authMiddleware } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { badRequest, notFound } from "../../utils/httpError";
import { generateContratoPdf, generateReciboPdf } from "../../utils/pdf";

export const vendasRouter = Router();
vendasRouter.use(authMiddleware);

const vendaSchema = z.object({
  clienteId: z.string().uuid(),
  animalId: z.string().uuid(),
  tipo: z.enum(["RESERVA", "VENDA"]).default("RESERVA"),
  status: z.enum(["RESERVADO", "PAGO", "ENTREGUE", "CANCELADO"]).default("RESERVADO"),
  valor: z.number().nonnegative(),
  sinal: z.number().nonnegative().optional().nullable(),
  dataReserva: z.coerce.date().optional().nullable(),
  dataVenda: z.coerce.date().optional().nullable(),
  observacoes: z.string().optional().nullable(),
});

vendasRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const vendas = await prisma.venda.findMany({
      where: { criatorioId: req.auth!.criatorioId },
      include: {
        cliente: { select: { id: true, nome: true, whatsapp: true } },
        animal: { select: { id: true, nome: true, especie: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(vendas);
  })
);

vendasRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = vendaSchema.parse(req.body);
    const criatorioId = req.auth!.criatorioId;

    const [cliente, animal] = await Promise.all([
      prisma.cliente.findFirst({ where: { id: data.clienteId, criatorioId } }),
      prisma.animal.findFirst({ where: { id: data.animalId, criatorioId } }),
    ]);
    if (!cliente || !animal) throw badRequest("Cliente ou animal inválido");

    const venda = await prisma.venda.create({ data: { ...data, criatorioId } });

    // Reserva/venda muda automaticamente o status do animal no plantel.
    await prisma.animal.update({
      where: { id: data.animalId },
      data: { status: data.tipo === "VENDA" ? "VENDIDO" : "RESERVADO" },
    });

    res.status(201).json(venda);
  })
);

vendasRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const existing = await prisma.venda.findFirst({
      where: { id: req.params.id, criatorioId: req.auth!.criatorioId },
    });
    if (!existing) throw notFound("Venda/reserva não encontrada");

    const data = vendaSchema.partial().parse(req.body);
    const venda = await prisma.venda.update({ where: { id: req.params.id }, data });

    if (data.status === "CANCELADO") {
      await prisma.animal.update({ where: { id: venda.animalId }, data: { status: "ATIVO" } });
    } else if (data.tipo === "VENDA" || data.status === "ENTREGUE") {
      await prisma.animal.update({ where: { id: venda.animalId }, data: { status: "VENDIDO" } });
    }

    res.json(venda);
  })
);

vendasRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const existing = await prisma.venda.findFirst({
      where: { id: req.params.id, criatorioId: req.auth!.criatorioId },
    });
    if (!existing) throw notFound("Venda/reserva não encontrada");
    await prisma.venda.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);

async function loadVendaCompleta(id: string, criatorioId: string) {
  const venda = await prisma.venda.findFirst({
    where: { id, criatorioId },
    include: { cliente: true, animal: true, criatorio: true },
  });
  if (!venda) throw notFound("Venda/reserva não encontrada");
  return venda;
}

vendasRouter.get(
  "/:id/recibo.pdf",
  asyncHandler(async (req, res) => {
    const venda = await loadVendaCompleta(req.params.id, req.auth!.criatorioId);
    const pdf = await generateReciboPdf(venda);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="recibo-${venda.id}.pdf"`);
    res.send(Buffer.from(pdf));
  })
);

vendasRouter.get(
  "/:id/contrato.pdf",
  asyncHandler(async (req, res) => {
    const venda = await loadVendaCompleta(req.params.id, req.auth!.criatorioId);
    const pdf = await generateContratoPdf(venda);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="contrato-${venda.id}.pdf"`);
    res.send(Buffer.from(pdf));
  })
);
