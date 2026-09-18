import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { authMiddleware } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { badRequest, notFound } from "../../utils/httpError";
import { calculateInbreedingCoefficient, fetchAnimalGraph } from "../../utils/pedigree";

export const reproducaoRouter = Router();
reproducaoRouter.use(authMiddleware);

// ---------------------------------------------------------------- Casais

const casalSchema = z.object({
  machoId: z.string().uuid(),
  femeaId: z.string().uuid(),
  apelido: z.string().optional().nullable(),
});

reproducaoRouter.get(
  "/casais",
  asyncHandler(async (req, res) => {
    const casais = await prisma.casal.findMany({
      where: { criatorioId: req.auth!.criatorioId },
      include: {
        macho: { select: { id: true, nome: true, anilha: true, fotoUrl: true } },
        femea: { select: { id: true, nome: true, anilha: true, fotoUrl: true } },
        _count: { select: { ninhadas: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(casais);
  })
);

reproducaoRouter.post(
  "/casais",
  asyncHandler(async (req, res) => {
    const data = casalSchema.parse(req.body);
    const criatorioId = req.auth!.criatorioId;

    const [macho, femea] = await Promise.all([
      prisma.animal.findFirst({ where: { id: data.machoId, criatorioId } }),
      prisma.animal.findFirst({ where: { id: data.femeaId, criatorioId } }),
    ]);
    if (!macho || !femea) throw badRequest("Macho e fêmea precisam pertencer a este criatório");
    if (macho.sexo === "FEMEA" || femea.sexo === "MACHO") {
      throw badRequest("Verifique o sexo dos animais selecionados para o casal");
    }

    const graph = await fetchAnimalGraph(criatorioId);
    const coeficiente = calculateInbreedingCoefficient(data.machoId, data.femeaId, graph);

    const casal = await prisma.casal.create({
      data: { ...data, criatorioId, coeficienteConsanguinidade: coeficiente },
    });
    res.status(201).json(casal);
  })
);

reproducaoRouter.delete(
  "/casais/:id",
  asyncHandler(async (req, res) => {
    const existing = await prisma.casal.findFirst({
      where: { id: req.params.id, criatorioId: req.auth!.criatorioId },
    });
    if (!existing) throw notFound("Casal não encontrado");
    await prisma.casal.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);

// ---------------------------------------------------------------- Ninhadas

const ninhadaSchema = z.object({
  casalId: z.string().uuid(),
  dataCruza: z.coerce.date().optional().nullable(),
  dataPostura: z.coerce.date().optional().nullable(),
  diasIncubacao: z.number().int().min(1).max(120).default(21),
  observacoes: z.string().optional().nullable(),
});

function calcularPrevisaoEclosao(dataPostura: Date | null | undefined, diasIncubacao: number) {
  if (!dataPostura) return null;
  const previsao = new Date(dataPostura);
  previsao.setDate(previsao.getDate() + diasIncubacao);
  return previsao;
}

reproducaoRouter.get(
  "/ninhadas",
  asyncHandler(async (req, res) => {
    const ninhadas = await prisma.ninhada.findMany({
      where: { criatorioId: req.auth!.criatorioId },
      include: {
        casal: {
          include: {
            macho: { select: { id: true, nome: true } },
            femea: { select: { id: true, nome: true } },
          },
        },
        ovos: true,
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(ninhadas);
  })
);

reproducaoRouter.get(
  "/ninhadas/:id",
  asyncHandler(async (req, res) => {
    const ninhada = await prisma.ninhada.findFirst({
      where: { id: req.params.id, criatorioId: req.auth!.criatorioId },
      include: {
        casal: { include: { macho: true, femea: true } },
        ovos: { orderBy: { numero: "asc" } },
      },
    });
    if (!ninhada) throw notFound("Ninhada não encontrada");
    res.json(ninhada);
  })
);

reproducaoRouter.post(
  "/ninhadas",
  asyncHandler(async (req, res) => {
    const data = ninhadaSchema.parse(req.body);
    const criatorioId = req.auth!.criatorioId;

    const casal = await prisma.casal.findFirst({ where: { id: data.casalId, criatorioId } });
    if (!casal) throw badRequest("Casal não encontrado");

    const previsaoEclosao = calcularPrevisaoEclosao(data.dataPostura, data.diasIncubacao);

    const ninhada = await prisma.ninhada.create({
      data: { ...data, criatorioId, previsaoEclosao },
    });
    res.status(201).json(ninhada);
  })
);

reproducaoRouter.put(
  "/ninhadas/:id",
  asyncHandler(async (req, res) => {
    const data = ninhadaSchema.partial().parse(req.body);
    const existing = await prisma.ninhada.findFirst({
      where: { id: req.params.id, criatorioId: req.auth!.criatorioId },
    });
    if (!existing) throw notFound("Ninhada não encontrada");

    const previsaoEclosao =
      data.dataPostura !== undefined
        ? calcularPrevisaoEclosao(data.dataPostura, data.diasIncubacao ?? existing.diasIncubacao)
        : undefined;

    const ninhada = await prisma.ninhada.update({
      where: { id: req.params.id },
      data: { ...data, ...(previsaoEclosao !== undefined ? { previsaoEclosao } : {}) },
    });
    res.json(ninhada);
  })
);

reproducaoRouter.delete(
  "/ninhadas/:id",
  asyncHandler(async (req, res) => {
    const existing = await prisma.ninhada.findFirst({
      where: { id: req.params.id, criatorioId: req.auth!.criatorioId },
    });
    if (!existing) throw notFound("Ninhada não encontrada");
    await prisma.ninhada.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);

// ---------------------------------------------------------------- Ovos

const ovoSchema = z.object({
  numero: z.number().int().min(1),
  dataPostura: z.coerce.date().optional().nullable(),
  status: z.enum(["AGUARDANDO", "GALADO", "BRANCO", "ECLODIU", "FALHOU"]).default("AGUARDANDO"),
  dataEclosao: z.coerce.date().optional().nullable(),
  animalNascidoId: z.string().uuid().optional().nullable(),
  observacoes: z.string().optional().nullable(),
});

reproducaoRouter.post(
  "/ninhadas/:id/ovos",
  asyncHandler(async (req, res) => {
    const ninhada = await prisma.ninhada.findFirst({
      where: { id: req.params.id, criatorioId: req.auth!.criatorioId },
    });
    if (!ninhada) throw notFound("Ninhada não encontrada");

    const data = ovoSchema.parse(req.body);
    const ovo = await prisma.ovo.create({ data: { ...data, ninhadaId: ninhada.id } });
    res.status(201).json(ovo);
  })
);

reproducaoRouter.put(
  "/ovos/:id",
  asyncHandler(async (req, res) => {
    const ovo = await prisma.ovo.findFirst({
      where: { id: req.params.id, ninhada: { criatorioId: req.auth!.criatorioId } },
    });
    if (!ovo) throw notFound("Ovo não encontrado");

    const data = ovoSchema.partial().parse(req.body);
    const updated = await prisma.ovo.update({ where: { id: req.params.id }, data });
    res.json(updated);
  })
);

reproducaoRouter.delete(
  "/ovos/:id",
  asyncHandler(async (req, res) => {
    const ovo = await prisma.ovo.findFirst({
      where: { id: req.params.id, ninhada: { criatorioId: req.auth!.criatorioId } },
    });
    if (!ovo) throw notFound("Ovo não encontrado");
    await prisma.ovo.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);

// ---------------------------------------------------------------- Estatísticas

reproducaoRouter.get(
  "/estatisticas",
  asyncHandler(async (req, res) => {
    const criatorioId = req.auth!.criatorioId;

    const casais = await prisma.casal.findMany({
      where: { criatorioId },
      include: {
        macho: { select: { id: true, nome: true } },
        femea: { select: { id: true, nome: true } },
        ninhadas: { include: { ovos: true } },
      },
    });

    function resumo(animalId: string, nome: string, papel: "macho" | "femea") {
      const relevantes = casais.filter((c) => (papel === "macho" ? c.machoId === animalId : c.femeaId === animalId));
      const ninhadas = relevantes.flatMap((c) => c.ninhadas);
      const totalOvos = ninhadas.reduce((acc, n) => acc + n.ovos.length, 0);
      const totalGalados = ninhadas.reduce((acc, n) => acc + n.ovos.filter((o) => o.status === "GALADO" || o.status === "ECLODIU").length, 0);
      const totalEclodidos = ninhadas.reduce((acc, n) => acc + n.ovos.filter((o) => o.status === "ECLODIU").length, 0);
      return {
        animalId,
        nome,
        totalNinhadas: ninhadas.length,
        totalOvos,
        totalGalados,
        totalEclodidos,
        taxaFertilidade: totalOvos ? Number(((totalGalados / totalOvos) * 100).toFixed(1)) : 0,
        taxaEclosao: totalOvos ? Number(((totalEclodidos / totalOvos) * 100).toFixed(1)) : 0,
      };
    }

    const machosMap = new Map<string, string>();
    const femeasMap = new Map<string, string>();
    for (const c of casais) {
      machosMap.set(c.machoId, c.macho.nome);
      femeasMap.set(c.femeaId, c.femea.nome);
    }

    const machos = Array.from(machosMap.entries())
      .map(([id, nome]) => resumo(id, nome, "macho"))
      .sort((a, b) => b.taxaEclosao - a.taxaEclosao);
    const femeas = Array.from(femeasMap.entries())
      .map(([id, nome]) => resumo(id, nome, "femea"))
      .sort((a, b) => b.taxaEclosao - a.taxaEclosao);

    res.json({ machos, femeas });
  })
);
