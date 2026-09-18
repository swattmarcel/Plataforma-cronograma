import { Router } from "express";
import { prisma } from "../../config/prisma";
import { asyncHandler } from "../../utils/asyncHandler";
import { notFound } from "../../utils/httpError";

export const publicRouter = Router();

// Página pública de verificação de autenticidade (acessada via QR Code do documento).
publicRouter.get(
  "/documentos/:codigo",
  asyncHandler(async (req, res) => {
    const documento = await prisma.documento.findUnique({
      where: { codigoVerificacao: req.params.codigo },
      include: {
        animal: { select: { nome: true, especie: true, mutacaoCor: true, sexo: true, anilha: true, dataNascimento: true } },
        criatorio: { select: { nome: true, registroIbama: true, registroClube: true, registroFederacao: true, logoUrl: true } },
      },
    });
    if (!documento) {
      return res.status(404).json({ valido: false, error: "Documento não encontrado ou inválido" });
    }
    res.json({
      valido: true,
      tipo: documento.tipo,
      geradoEm: documento.geradoEm,
      animal: documento.animal,
      criatorio: documento.criatorio,
    });
  })
);
