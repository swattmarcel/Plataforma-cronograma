import fs from "fs";
import path from "path";
import multer from "multer";
import { put } from "@vercel/blob";
import { v4 as uuid } from "uuid";
import { env } from "../config/env";

const uploadsRoot = path.resolve(process.cwd(), env.uploadsDir);
const usingBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

if (!usingBlob && !fs.existsSync(uploadsRoot)) {
  fs.mkdirSync(uploadsRoot, { recursive: true });
}

// Em produção (Vercel) o disco é somente leitura/efêmero, então os arquivos
// enviados (fotos, logos, mídias, fundos de documento) vão para o Vercel
// Blob quando BLOB_READ_WRITE_TOKEN está configurado. Em desenvolvimento
// local, sem esse token, caem de volta para o disco em ./uploads.
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Apenas imagens são permitidas"));
      return;
    }
    cb(null, true);
  },
});

// Upload de mídia (áudio/vídeo) para o histórico de competições.
export const uploadMidia = multer({
  storage,
  limits: { fileSize: 40 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("audio/") && !file.mimetype.startsWith("video/")) {
      cb(new Error("Apenas arquivos de áudio ou vídeo são permitidos"));
      return;
    }
    cb(null, true);
  },
});

/**
 * Persiste um arquivo recebido via multer (memoryStorage) e retorna a URL
 * pública para salvar no banco. Usa Vercel Blob quando disponível, senão
 * grava em ./uploads (apenas para desenvolvimento local).
 */
export async function saveUploadedFile(file: Express.Multer.File): Promise<string> {
  const ext = path.extname(file.originalname) || "";
  const filename = `${uuid()}${ext}`;

  if (usingBlob) {
    const blob = await put(filename, file.buffer, { access: "public", contentType: file.mimetype });
    return blob.url;
  }

  fs.writeFileSync(path.join(uploadsRoot, filename), file.buffer);
  return `/uploads/${filename}`;
}

/**
 * Resolve uma URL salva (Blob absoluta ou caminho local /uploads/...) para
 * bytes de imagem, usado ao montar PDFs (logo, foto do animal, fundo do
 * documento).
 */
export async function resolveUploadBytes(url: string | null | undefined): Promise<Buffer | null> {
  if (!url) return null;

  if (/^https?:\/\//i.test(url)) {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      return Buffer.from(await res.arrayBuffer());
    } catch {
      return null;
    }
  }

  const filePath = path.join(uploadsRoot, path.basename(url));
  return fs.existsSync(filePath) ? fs.readFileSync(filePath) : null;
}

export const uploadsRootPath = uploadsRoot;
