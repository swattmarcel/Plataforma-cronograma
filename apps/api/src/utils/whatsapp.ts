/**
 * Ponto de integração para envio de lembretes via WhatsApp.
 *
 * Este projeto não inclui credenciais de nenhum provedor (Meta Cloud API,
 * Twilio, etc). Para ativar o envio real, configure as variáveis de
 * ambiente WHATSAPP_API_URL e WHATSAPP_API_TOKEN e implemente a chamada
 * HTTP correspondente ao provedor escolhido abaixo. Enquanto não
 * configurado, a função apenas registra a mensagem no log do servidor —
 * o restante do fluxo (agendamento, cálculo de horários, marcação de
 * "enviado") funciona normalmente.
 */

interface LembreteMedicacao {
  telefone: string;
  animalNome: string;
  medicamento: string;
  dose: string | null;
  horario: string;
}

export async function enviarLembreteWhatsApp(lembrete: LembreteMedicacao): Promise<{ enviado: boolean; motivo?: string }> {
  const apiUrl = process.env.WHATSAPP_API_URL;
  const apiToken = process.env.WHATSAPP_API_TOKEN;

  const mensagem =
    `🔔 Lembrete de medicação\n` +
    `Ave: ${lembrete.animalNome}\n` +
    `Medicamento: ${lembrete.medicamento}${lembrete.dose ? ` (${lembrete.dose})` : ""}\n` +
    `Horário: ${lembrete.horario}`;

  if (!apiUrl || !apiToken) {
    console.log(`[whatsapp:stub] Para ${lembrete.telefone} -> ${mensagem.replace(/\n/g, " | ")}`);
    return { enviado: false, motivo: "Provedor de WhatsApp não configurado (WHATSAPP_API_URL/WHATSAPP_API_TOKEN)" };
  }

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiToken}` },
    body: JSON.stringify({ to: lembrete.telefone, message: mensagem }),
  });

  if (!response.ok) {
    return { enviado: false, motivo: `Falha do provedor (HTTP ${response.status})` };
  }
  return { enviado: true };
}
