import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { authMiddleware } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { badRequest, notFound } from "../../utils/httpError";
import { upload, saveUploadedFile } from "../../utils/upload";
import { buildPedigreeTree, calculateInbreedingCoefficient, fetchAnimalGraph } from "../../utils/pedigree";

export const animaisRouter = Router();
animaisRouter.use(authMiddleware);

const sexoEnum = z.enum(["MACHO", "FEMEA", "INDEFINIDO"]);
const statusEnum = z.enum(["ATIVO", "RESERVADO", "VENDIDO", "FALECIDO", "FUGIU"]);

const animalSchema = z.object({
  nome: z.string().min(1),
  especie: z.string().min(1),
  mutacaoCor: z.string().optional().nullable(),
  anilha: z.string().optional().nullable(),
  microchip: z.string().optional().nullable(),
  sexo: sexoEnum.default("INDEFINIDO"),
  dataNascimento: z.coerce.date().optional().nullable(),
  status: statusEnum.default("ATIVO"),
  paiId: z.string().uuid().optional().nullable(),
  maeId: z.string().uuid().optional().nullable(),
  observacoes: z.string().optional().nullable(),
});

// Listagem com filtros básicos (espécie, sexo, status, busca por nome/anilha)
animaisRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { especie, sexo, status, q } = req.query as Record<string, string | undefined>;
    const animais = await prisma.animal.findMany({
      where: {
        criatorioId: req.auth!.criatorioId,
        ...(especie ? { especie } : {}),
        ...(sexo ? { sexo: sexo as any } : {}),
        ...(status ? { status: status as any } : {}),
        ...(q
          ? {
              OR: [
                { nome: { contains: q, mode: "insensitive" } },
                { anilha: { contains: q, mode: "insensitive" } },
                { microchip: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: { pai: { select: { id: true, nome: true } }, mae: { select: { id: true, nome: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(animais);
  })
);

// Resumo do plantel para o dashboard
animaisRouter.get(
  "/resumo",
  asyncHandler(async (req, res) => {
    const criatorioId = req.auth!.criatorioId;
    const [machos, femeas, indefinidos, ativos, total] = await Promise.all([
      prisma.animal.count({ where: { criatorioId, sexo: "MACHO", status: { in: ["ATIVO", "RESERVADO"] } } }),
      prisma.animal.count({ where: { criatorioId, sexo: "FEMEA", status: { in: ["ATIVO", "RESERVADO"] } } }),
      prisma.animal.count({ where: { criatorioId, sexo: "INDEFINIDO", status: { in: ["ATIVO", "RESERVADO"] } } }),
      prisma.animal.count({ where: { criatorioId, status: { in: ["ATIVO", "RESERVADO"] } } }),
      prisma.animal.count({ where: { criatorioId } }),
    ]);
    res.json({ machos, femeas, filhotesNaoSexados: indefinidos, ativos, total });
  })
);

animaisRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const animal = await prisma.animal.findFirst({
      where: { id: req.params.id, criatorioId: req.auth!.criatorioId },
      include: {
        pai: { select: { id: true, nome: true, anilha: true, sexo: true } },
        mae: { select: { id: true, nome: true, anilha: true, sexo: true } },
        filhosComoPai: { select: { id: true, nome: true, sexo: true, dataNascimento: true } },
        filhosComoMae: { select: { id: true, nome: true, sexo: true, dataNascimento: true } },
      },
    });
    if (!animal) throw notFound("Animal não encontrado");
    res.json(animal);
  })
);

animaisRouter.get(
  "/:id/pedigree",
  asyncHandler(async (req, res) => {
    const geracoes = Math.min(6, Math.max(1, Number(req.query.geracoes ?? 4)));
    const animal = await prisma.animal.findFirst({
      where: { id: req.params.id, criatorioId: req.auth!.criatorioId },
      select: { id: true },
    });
    if (!animal) throw notFound("Animal não encontrado");
    const tree = await buildPedigreeTree(animal.id, geracoes);
    res.json(tree);
  })
);

async function assertParentBelongsToCriatorio(criatorioId: string, animalId: string | null | undefined) {
  if (!animalId) return;
  const parent = await prisma.animal.findFirst({ where: { id: animalId, criatorioId } });
  if (!parent) throw badRequest("Pai/mãe informado não pertence a este criatório");
}

animaisRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = animalSchema.parse(req.body);
    const criatorioId = req.auth!.criatorioId;

    if (data.paiId && data.maeId && data.paiId === data.maeId) {
      throw badRequest("Pai e mãe não podem ser o mesmo animal");
    }
    await assertParentBelongsToCriatorio(criatorioId, data.paiId);
    await assertParentBelongsToCriatorio(criatorioId, data.maeId);

    const animal = await prisma.animal.create({
      data: { ...data, criatorioId },
    });
    res.status(201).json(animal);
  })
);

animaisRouter.put(
  "/:id",
  asyncHandler(async (req, res) => {
    const data = animalSchema.partial().parse(req.body);
    const criatorioId = req.auth!.criatorioId;

    const existing = await prisma.animal.findFirst({ where: { id: req.params.id, criatorioId } });
    if (!existing) throw notFound("Animal não encontrado");

    if (data.paiId && data.paiId === req.params.id) throw badRequest("Animal não pode ser pai de si mesmo");
    if (data.maeId && data.maeId === req.params.id) throw badRequest("Animal não pode ser mãe de si mesmo");
    if (data.paiId) await assertParentBelongsToCriatorio(criatorioId, data.paiId);
    if (data.maeId) await assertParentBelongsToCriatorio(criatorioId, data.maeId);

    const animal = await prisma.animal.update({ where: { id: req.params.id }, data });
    res.json(animal);
  })
);

animaisRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const existing = await prisma.animal.findFirst({
      where: { id: req.params.id, criatorioId: req.auth!.criatorioId },
    });
    if (!existing) throw notFound("Animal não encontrado");
    await prisma.animal.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);

animaisRouter.post(
  "/:id/foto",
  upload.single("foto"),
  asyncHandler(async (req, res) => {
    const existing = await prisma.animal.findFirst({
      where: { id: req.params.id, criatorioId: req.auth!.criatorioId },
    });
    if (!existing) throw notFound("Animal não encontrado");
    if (!req.file) throw badRequest("Arquivo de foto não enviado");

    const animal = await prisma.animal.update({
      where: { id: req.params.id },
      data: { fotoUrl: await saveUploadedFile(req.file) },
    });
    res.json(animal);
  })
);

// Simula o cruzamento entre dois animais e retorna o coeficiente de consanguinidade,
// sem exigir que exista de fato um casal cadastrado (útil na hora de decidir o cruzamento).
const consanguinidadeSchema = z.object({
  paiId: z.string().uuid(),
  maeId: z.string().uuid(),
});

animaisRouter.post(
  "/consanguinidade",
  asyncHandler(async (req, res) => {
    const { paiId, maeId } = consanguinidadeSchema.parse(req.body);
    const criatorioId = req.auth!.criatorioId;
    await assertParentBelongsToCriatorio(criatorioId, paiId);
    await assertParentBelongsToCriatorio(criatorioId, maeId);

    const graph = await fetchAnimalGraph(criatorioId);
    const coeficiente = calculateInbreedingCoefficient(paiId, maeId, graph);

    let nivel: "baixo" | "moderado" | "alto" | "critico" = "baixo";
    if (coeficiente >= 0.25) nivel = "critico";
    else if (coeficiente >= 0.125) nivel = "alto";
    else if (coeficiente >= 0.0625) nivel = "moderado";

    res.json({ coeficiente, percentual: Number((coeficiente * 100).toFixed(2)), nivel });
  })
);
