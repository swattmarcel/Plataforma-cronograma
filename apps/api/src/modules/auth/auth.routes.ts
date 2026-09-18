import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { env } from "../../config/env";
import { prisma } from "../../config/prisma";
import { asyncHandler } from "../../utils/asyncHandler";
import { badRequest, unauthorized } from "../../utils/httpError";
import { authMiddleware } from "../../middleware/auth";

export const authRouter = Router();

const registerSchema = z.object({
  nome: z.string().min(2),
  email: z.string().email(),
  senha: z.string().min(6),
  criatorioNome: z.string().min(2),
});

function signToken(userId: string) {
  return jwt.sign({ userId }, env.jwtSecret, { expiresIn: "30d" });
}

authRouter.post(
  "/register",
  asyncHandler(async (req, res) => {
    const data = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw badRequest("Já existe uma conta com este e-mail");
    }

    const passwordHash = await bcrypt.hash(data.senha, 10);

    const user = await prisma.user.create({
      data: {
        nome: data.nome,
        email: data.email,
        passwordHash,
        criatorio: {
          create: {
            nome: data.criatorioNome,
          },
        },
      },
      include: { criatorio: true },
    });

    const token = signToken(user.id);
    res.status(201).json({
      token,
      user: { id: user.id, nome: user.nome, email: user.email },
      criatorio: user.criatorio,
    });
  })
);

const loginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(1),
});

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const data = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: { criatorio: true },
    });
    if (!user) {
      throw unauthorized("E-mail ou senha inválidos");
    }

    const valid = await bcrypt.compare(data.senha, user.passwordHash);
    if (!valid) {
      throw unauthorized("E-mail ou senha inválidos");
    }

    const token = signToken(user.id);
    res.json({
      token,
      user: { id: user.id, nome: user.nome, email: user.email },
      criatorio: user.criatorio,
    });
  })
);

authRouter.get(
  "/me",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.auth!.userId },
      include: { criatorio: true },
    });
    res.json({ user: { id: user!.id, nome: user!.nome, email: user!.email }, criatorio: user!.criatorio });
  })
);
