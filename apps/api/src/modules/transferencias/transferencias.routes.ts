import { Router } from "express";
import { z } from "zod";
import { customAlphabet } from "nanoid";
import { prisma } from "../../config/prisma";
import { authMiddleware } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { badRequest, notFound } from "../../utils/httpError";

export const transferenciasRouter = Router();
transferenciasRouter.use(authMiddleware);

const gerarCodigo = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 8);
const DIAS_VALIDADE = 7;

// O destinatário gera um código temporário e o compartilha (por WhatsApp,
// por exemplo) com quem vai transferir a ave para ele.
transferenciasRouter.post(
  "/gerar-codigo",
  asyncHandler(async (req, res) => {
    const criatorioId = req.auth!.criatorioId;
    const expiraEm = new Date();
    expiraEm.setDate(expiraEm.getDate() + DIAS_VALIDADE);

    const transferencia = await prisma.transferenciaCodigo.create({
      data: { criatorioId, codigo: gerarCodigo(), expiraEm },
    });
    res.status(201).json(transferencia);
  })
);

transferenciasRouter.get(
  "/codigos",
  asyncHandler(async (req, res) => {
    const codigos = await prisma.transferenciaCodigo.findMany({
      where: { criatorioId: req.auth!.criatorioId },
      include: { animal: { select: { id: true, nome: true, especie: true } } },
      orderBy: { criadoEm: "desc" },
    });
    res.json(codigos);
  })
);

transferenciasRouter.delete(
  "/codigos/:id",
  asyncHandler(async (req, res) => {
    const existing = await prisma.transferenciaCodigo.findFirst({
      where: { id: req.params.id, criatorioId: req.auth!.criatorioId, status: "ATIVO" },
    });
    if (!existing) throw notFound("Código não encontrado ou já utilizado");
    await prisma.transferenciaCodigo.update({ where: { id: existing.id }, data: { status: "CANCELADO" } });
    res.status(204).send();
  })
);

// Histórico de aves recebidas por transferência neste criatório.
transferenciasRouter.get(
  "/recebidas",
  asyncHandler(async (req, res) => {
    const recebidas = await prisma.transferenciaCodigo.findMany({
      where: { criatorioId: req.auth!.criatorioId, status: "USADO" },
      include: { animal: { select: { id: true, nome: true, especie: true } } },
      orderBy: { usadoEm: "desc" },
    });
    res.json(recebidas);
  })
);

// Histórico de aves enviadas por este criatório para outros.
transferenciasRouter.get(
  "/enviadas",
  asyncHandler(async (req, res) => {
    const enviadas = await prisma.transferenciaCodigo.findMany({
      where: { origemCriatorioId: req.auth!.criatorioId, status: "USADO" },
      include: { animal: { select: { id: true, nome: true, especie: true } }, criatorio: { select: { nome: true } } },
      orderBy: { usadoEm: "desc" },
    });
    res.json(enviadas);
  })
);

// Quem está transferindo informa o código recebido e escolhe a ave do seu
// próprio plantel para confirmar o envio.
const confirmarSchema = z.object({
  codigo: z.string().min(4),
  animalId: z.string().uuid(),
});

transferenciasRouter.post(
  "/confirmar",
  asyncHandler(async (req, res) => {
    const { codigo, animalId } = confirmarSchema.parse(req.body);
    const origemCriatorioId = req.auth!.criatorioId;

    const transferencia = await prisma.transferenciaCodigo.findUnique({ where: { codigo: codigo.toUpperCase() } });
    if (!transferencia || transferencia.status !== "ATIVO") {
      throw badRequest("Código inválido, expirado ou já utilizado");
    }
    if (transferencia.expiraEm < new Date()) {
      await prisma.transferenciaCodigo.update({ where: { id: transferencia.id }, data: { status: "EXPIRADO" } });
      throw badRequest("Código expirado. Peça um novo código ao destinatário.");
    }
    if (transferencia.criatorioId === origemCriatorioId) {
      throw badRequest("Você não pode transferir uma ave para o seu próprio criatório");
    }

    const animal = await prisma.animal.findFirst({ where: { id: animalId, criatorioId: origemCriatorioId } });
    if (!animal) throw badRequest("Animal não encontrado no seu plantel");

    const [origem] = await Promise.all([prisma.criatorio.findUnique({ where: { id: origemCriatorioId } })]);

    const resultado = await prisma.$transaction(async (tx) => {
      const animalTransferido = await tx.animal.update({
        where: { id: animalId },
        data: { criatorioId: transferencia.criatorioId },
      });

      // Saúde, medicações, competições e sessões de canto acompanham a ave.
      await Promise.all([
        tx.registroSaude.updateMany({ where: { animalId }, data: { criatorioId: transferencia.criatorioId } }),
        tx.medicacao.updateMany({ where: { animalId }, data: { criatorioId: transferencia.criatorioId } }),
        tx.competicao.updateMany({ where: { animalId }, data: { criatorioId: transferencia.criatorioId } }),
        tx.sessaoCanto.updateMany({ where: { animalId }, data: { criatorioId: transferencia.criatorioId } }),
      ]);

      const transferenciaAtualizada = await tx.transferenciaCodigo.update({
        where: { id: transferencia.id },
        data: {
          status: "USADO",
          animalId,
          origemCriatorioId,
          origemCriatorioNome: origem?.nome ?? null,
          usadoEm: new Date(),
        },
      });

      return { animal: animalTransferido, transferencia: transferenciaAtualizada };
    });

    res.json(resultado);
  })
);
