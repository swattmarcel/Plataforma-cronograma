import { Router } from "express";
import { prisma } from "../../config/prisma";
import { authMiddleware } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";

export const dashboardRouter = Router();
dashboardRouter.use(authMiddleware);

dashboardRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const criatorioId = req.auth!.criatorioId;
    const now = new Date();
    const em30dias = new Date(now);
    em30dias.setDate(em30dias.getDate() + 30);

    const [machos, femeas, indefinidos, ativos, total] = await Promise.all([
      prisma.animal.count({ where: { criatorioId, sexo: "MACHO", status: { in: ["ATIVO", "RESERVADO"] } } }),
      prisma.animal.count({ where: { criatorioId, sexo: "FEMEA", status: { in: ["ATIVO", "RESERVADO"] } } }),
      prisma.animal.count({ where: { criatorioId, sexo: "INDEFINIDO", status: { in: ["ATIVO", "RESERVADO"] } } }),
      prisma.animal.count({ where: { criatorioId, status: { in: ["ATIVO", "RESERVADO"] } } }),
      prisma.animal.count({ where: { criatorioId } }),
    ]);

    const eventosProximos = await prisma.evento.findMany({
      where: { criatorioId, concluido: false, data: { lte: em30dias } },
      include: { animal: { select: { id: true, nome: true } } },
      orderBy: { data: "asc" },
      take: 20,
    });

    const ninhadasEmAndamento = await prisma.ninhada.findMany({
      where: { criatorioId, status: "EM_ANDAMENTO" },
      include: {
        casal: { include: { macho: { select: { nome: true } }, femea: { select: { nome: true } } } },
        ovos: true,
      },
      orderBy: { previsaoEclosao: "asc" },
    });

    const nascimentosPrevistos = ninhadasEmAndamento
      .filter((n) => n.previsaoEclosao)
      .map((n) => ({
        ninhadaId: n.id,
        casal: `${n.casal.macho.nome} x ${n.casal.femea.nome}`,
        previsaoEclosao: n.previsaoEclosao,
        qtdOvos: n.ovos.length,
      }));

    res.json({
      plantel: { machos, femeas, filhotesNaoSexados: indefinidos, ativos, total },
      alertas: eventosProximos,
      nascimentosPrevistos,
    });
  })
);
