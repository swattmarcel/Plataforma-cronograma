import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { authMiddleware } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { badRequest, notFound } from "../../utils/httpError";

export const saudeRouter = Router();
saudeRouter.use(authMiddleware);

// ---------------------------------------------------------------- Registros de saúde

const registroSchema = z.object({
  animalId: z.string().uuid(),
  tipo: z.enum(["DOENCA", "TRATAMENTO", "VACINA", "OBSERVACAO"]),
  titulo: z.string().min(1),
  descricao: z.string().optional().nullable(),
  data: z.coerce.date(),
});

saudeRouter.get(
  "/registros",
  asyncHandler(async (req, res) => {
    const { animalId } = req.query as Record<string, string | undefined>;
    const registros = await prisma.registroSaude.findMany({
      where: { criatorioId: req.auth!.criatorioId, ...(animalId ? { animalId } : {}) },
      include: { animal: { select: { id: true, nome: true } } },
      orderBy: { data: "desc" },
    });
    res.json(registros);
  })
);

saudeRouter.post(
  "/registros",
  asyncHandler(async (req, res) => {
    const data = registroSchema.parse(req.body);
    const criatorioId = req.auth!.criatorioId;
    const animal = await prisma.animal.findFirst({ where: { id: data.animalId, criatorioId } });
    if (!animal) throw badRequest("Animal não encontrado");

    const registro = await prisma.registroSaude.create({ data: { ...data, criatorioId } });
    res.status(201).json(registro);
  })
);

saudeRouter.delete(
  "/registros/:id",
  asyncHandler(async (req, res) => {
    const existing = await prisma.registroSaude.findFirst({
      where: { id: req.params.id, criatorioId: req.auth!.criatorioId },
    });
    if (!existing) throw notFound("Registro não encontrado");
    await prisma.registroSaude.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);

// ---------------------------------------------------------------- Medicações

const horarioRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const medicacaoSchema = z.object({
  animalId: z.string().uuid(),
  medicamento: z.string().min(1),
  dose: z.string().optional().nullable(),
  horarios: z.array(z.string().regex(horarioRegex, "Use o formato HH:MM")).min(1),
  dataInicio: z.coerce.date(),
  dataFim: z.coerce.date().optional().nullable(),
  ativo: z.boolean().default(true),
  whatsappAtivo: z.boolean().default(false),
});

saudeRouter.get(
  "/medicacoes",
  asyncHandler(async (req, res) => {
    const { animalId } = req.query as Record<string, string | undefined>;
    const medicacoes = await prisma.medicacao.findMany({
      where: { criatorioId: req.auth!.criatorioId, ...(animalId ? { animalId } : {}) },
      include: { animal: { select: { id: true, nome: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(medicacoes);
  })
);

saudeRouter.post(
  "/medicacoes",
  asyncHandler(async (req, res) => {
    const data = medicacaoSchema.parse(req.body);
    const criatorioId = req.auth!.criatorioId;
    const animal = await prisma.animal.findFirst({ where: { id: data.animalId, criatorioId } });
    if (!animal) throw badRequest("Animal não encontrado");

    if (data.whatsappAtivo) {
      const criatorio = await prisma.criatorio.findUnique({ where: { id: criatorioId } });
      if (!criatorio?.whatsapp) {
        throw badRequest("Cadastre um WhatsApp em Configurações antes de ativar os lembretes");
      }
    }

    const medicacao = await prisma.medicacao.create({ data: { ...data, criatorioId } });
    res.status(201).json(medicacao);
  })
);

saudeRouter.put(
  "/medicacoes/:id",
  asyncHandler(async (req, res) => {
    const existing = await prisma.medicacao.findFirst({
      where: { id: req.params.id, criatorioId: req.auth!.criatorioId },
    });
    if (!existing) throw notFound("Medicação não encontrada");
    const data = medicacaoSchema.partial().parse(req.body);
    const medicacao = await prisma.medicacao.update({ where: { id: req.params.id }, data });
    res.json(medicacao);
  })
);

saudeRouter.delete(
  "/medicacoes/:id",
  asyncHandler(async (req, res) => {
    const existing = await prisma.medicacao.findFirst({
      where: { id: req.params.id, criatorioId: req.auth!.criatorioId },
    });
    if (!existing) throw notFound("Medicação não encontrada");
    await prisma.medicacao.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);
