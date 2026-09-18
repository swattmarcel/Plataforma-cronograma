import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { authMiddleware } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { notFound } from "../../utils/httpError";
import { buildPedigreeTree } from "../../utils/pedigree";
import { generateCrachaPdf, generatePedigreeCertificatePdf } from "../../utils/pdf";

export const documentosRouter = Router();
documentosRouter.use(authMiddleware);

documentosRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const documentos = await prisma.documento.findMany({
      where: { criatorioId: req.auth!.criatorioId },
      include: { animal: { select: { id: true, nome: true, especie: true, sexo: true } } },
      orderBy: { geradoEm: "desc" },
    });
    res.json(documentos);
  })
);

const documentoSchema = z.object({
  animalId: z.string().uuid(),
  tipo: z.enum(["CERTIFICADO_ORIGEM", "CRACHA"]),
  geracoes: z.number().int().min(1).max(6).default(3),
  templateId: z.string().uuid().optional().nullable(),
});

documentosRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = documentoSchema.parse(req.body);
    const criatorioId = req.auth!.criatorioId;

    const animal = await prisma.animal.findFirst({ where: { id: data.animalId, criatorioId } });
    if (!animal) throw notFound("Animal não encontrado");

    let templateId = data.templateId ?? null;
    if (!templateId) {
      const padrao = await prisma.documentoTemplate.findFirst({ where: { criatorioId, tipo: data.tipo, padrao: true } });
      templateId = padrao?.id ?? null;
    }

    const documento = await prisma.documento.create({
      data: { criatorioId, animalId: data.animalId, tipo: data.tipo, geracoes: data.geracoes, templateId },
    });
    res.status(201).json(documento);
  })
);

async function loadDocumentoCompleto(id: string, criatorioId: string) {
  const documento = await prisma.documento.findFirst({
    where: { id, criatorioId },
    include: { animal: true, criatorio: true, template: true },
  });
  if (!documento) throw notFound("Documento não encontrado");
  return documento;
}

documentosRouter.get(
  "/:id/download",
  asyncHandler(async (req, res) => {
    const documento = await loadDocumentoCompleto(req.params.id, req.auth!.criatorioId);
    const template = documento.template
      ? {
          corPrimaria: documento.template.corPrimaria,
          corFundo: documento.template.corFundo,
          corTexto: documento.template.corTexto,
          fonte: documento.template.fonte as "helvetica" | "times" | "courier",
          mostrarLogo: documento.template.mostrarLogo,
          mostrarQr: documento.template.mostrarQr,
          mostrarRegistrosLegais: documento.template.mostrarRegistrosLegais,
          backgroundUrl: documento.template.backgroundUrl,
        }
      : undefined;

    let pdf: Uint8Array;
    if (documento.tipo === "CERTIFICADO_ORIGEM") {
      const pedigree = await buildPedigreeTree(documento.animalId, documento.geracoes);
      pdf = await generatePedigreeCertificatePdf({
        animal: documento.animal,
        criatorio: documento.criatorio,
        pedigree,
        codigoVerificacao: documento.codigoVerificacao,
        geracoes: documento.geracoes,
        template,
      });
    } else {
      pdf = await generateCrachaPdf({
        animal: documento.animal,
        criatorio: documento.criatorio,
        codigoVerificacao: documento.codigoVerificacao,
        template,
      });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="documento-${documento.id}.pdf"`);
    res.send(Buffer.from(pdf));
  })
);

documentosRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const existing = await prisma.documento.findFirst({
      where: { id: req.params.id, criatorioId: req.auth!.criatorioId },
    });
    if (!existing) throw notFound("Documento não encontrado");
    await prisma.documento.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);
