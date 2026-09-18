import { Router } from "express";
import multer from "multer";
import pdfParse from "pdf-parse";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { authMiddleware } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { badRequest } from "../../utils/httpError";
import { parseSispassTexto } from "../../utils/sispassParser";

export const importacaoRouter = Router();
importacaoRouter.use(authMiddleware);

const uploadPdf = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      cb(new Error("Envie um arquivo PDF"));
      return;
    }
    cb(null, true);
  },
});

/**
 * Extração heurística de um PDF exportado do SISPASS/IBAMA. Como o layout
 * exato pode variar, o resultado é sempre apresentado para conferência e
 * edição manual antes da importação de fato — nada é salvo nesta etapa.
 */
importacaoRouter.post(
  "/sispass/preview",
  uploadPdf.single("pdf"),
  asyncHandler(async (req, res) => {
    if (!req.file) throw badRequest("Envie o PDF do SISPASS");

    let texto = "";
    try {
      const resultado = await pdfParse(req.file.buffer);
      texto = resultado.text ?? "";
    } catch (err) {
      throw badRequest("Não foi possível ler o PDF. Verifique se o arquivo não está corrompido ou protegido.");
    }

    if (!texto.trim()) {
      throw badRequest(
        "Não foi possível extrair texto deste PDF (pode ser um documento escaneado como imagem). Cadastre os animais manualmente."
      );
    }

    const candidatos = parseSispassTexto(texto);
    res.json({
      totalLinhas: texto.split(/\r?\n/).filter(Boolean).length,
      candidatos,
      aviso:
        candidatos.length === 0
          ? "Nenhuma anilha foi reconhecida automaticamente. Confira o texto extraído e cadastre manualmente."
          : "Revise os dados abaixo antes de importar — a leitura automática pode não ser 100% precisa.",
    });
  })
);

const confirmarSchema = z.object({
  animais: z
    .array(
      z.object({
        nome: z.string().min(1),
        especie: z.string().min(1),
        anilha: z.string().optional().nullable(),
        sexo: z.enum(["MACHO", "FEMEA", "INDEFINIDO"]).default("INDEFINIDO"),
      })
    )
    .min(1),
});

importacaoRouter.post(
  "/sispass/confirmar",
  asyncHandler(async (req, res) => {
    const { animais } = confirmarSchema.parse(req.body);
    const criatorioId = req.auth!.criatorioId;

    const criados = await prisma.animal.createMany({
      data: animais.map((a) => ({ ...a, criatorioId })),
    });

    res.status(201).json({ importados: criados.count });
  })
);
