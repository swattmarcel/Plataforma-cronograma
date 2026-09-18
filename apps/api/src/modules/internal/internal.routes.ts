import { Router } from "express";
import { prisma } from "../../config/prisma";
import { asyncHandler } from "../../utils/asyncHandler";
import { forbidden } from "../../utils/httpError";
import { enviarLembreteWhatsApp } from "../../utils/whatsapp";

export const internalRouter = Router();

/**
 * Endpoint de manutenção para disparo dos lembretes de medicação via
 * WhatsApp, pensado para ser chamado por um cron externo (ex.: a cada
 * minuto). Protegido por um segredo compartilhado (header
 * x-internal-secret), não pelo login do criador — nenhum usuário chama
 * isso diretamente pelo app.
 */
internalRouter.post(
  "/lembretes/processar",
  asyncHandler(async (req, res) => {
    const secret = process.env.INTERNAL_CRON_SECRET;
    if (!secret || req.header("x-internal-secret") !== secret) {
      throw forbidden("Segredo interno inválido ou não configurado");
    }

    const agora = new Date();
    const janelaMinutos = 5;

    const medicacoes = await prisma.medicacao.findMany({
      where: {
        ativo: true,
        whatsappAtivo: true,
        dataInicio: { lte: agora },
        OR: [{ dataFim: null }, { dataFim: { gte: agora } }],
      },
      include: { animal: { select: { nome: true } }, criatorio: { select: { whatsapp: true } } },
    });

    const enviados: string[] = [];
    const ignorados: string[] = [];

    for (const med of medicacoes) {
      if (!med.criatorio.whatsapp) continue;

      for (const horario of med.horarios) {
        const [h, m] = horario.split(":").map(Number);
        const alvo = new Date(agora);
        alvo.setHours(h, m, 0, 0);
        const avisoEm = new Date(alvo.getTime() - janelaMinutos * 60 * 1000);

        const dentroDaJanela = agora >= avisoEm && agora <= alvo;
        if (!dentroDaJanela) continue;

        const jaEnviadoHoje =
          med.ultimoLembreteEm &&
          med.ultimoLembreteEm.toDateString() === agora.toDateString() &&
          Math.abs(med.ultimoLembreteEm.getTime() - alvo.getTime()) < 20 * 60 * 1000;
        if (jaEnviadoHoje) {
          ignorados.push(`${med.id}@${horario}`);
          continue;
        }

        const resultado = await enviarLembreteWhatsApp({
          telefone: med.criatorio.whatsapp,
          animalNome: med.animal.nome,
          medicamento: med.medicamento,
          dose: med.dose,
          horario,
        });

        await prisma.medicacao.update({ where: { id: med.id }, data: { ultimoLembreteEm: agora } });
        enviados.push(`${med.id}@${horario} (${resultado.enviado ? "enviado" : resultado.motivo})`);
      }
    }

    res.json({ processados: medicacoes.length, enviados, ignorados });
  })
);
