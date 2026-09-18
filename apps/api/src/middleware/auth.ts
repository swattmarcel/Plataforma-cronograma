import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { prisma } from "../config/prisma";
import { unauthorized } from "../utils/httpError";

export interface AuthPayload {
  userId: string;
  criatorioId: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}

export async function authMiddleware(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      throw unauthorized();
    }
    const token = header.slice("Bearer ".length);
    const decoded = jwt.verify(token, env.jwtSecret) as { userId: string };

    const criatorio = await prisma.criatorio.findUnique({ where: { userId: decoded.userId } });
    if (!criatorio) {
      throw unauthorized("Criatório não configurado para este usuário");
    }

    req.auth = { userId: decoded.userId, criatorioId: criatorio.id };
    next();
  } catch (err) {
    next(unauthorized());
  }
}
