import fs from "fs";
import path from "path";
import multer from "multer";
import { v4 as uuid } from "uuid";
import { env } from "../config/env";

const uploadsRoot = path.resolve(process.cwd(), env.uploadsDir);
if (!fs.existsSync(uploadsRoot)) {
  fs.mkdirSync(uploadsRoot, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsRoot),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `${uuid()}${ext}`);
  },
});

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

export function publicUrlFor(filename: string): string {
  return `/uploads/${filename}`;
}

export function resolveUploadPath(url: string | null | undefined): string | null {
  if (!url) return null;
  const filename = path.basename(url);
  const filePath = path.join(uploadsRoot, filename);
  return fs.existsSync(filePath) ? filePath : null;
}

export const uploadsRootPath = uploadsRoot;
