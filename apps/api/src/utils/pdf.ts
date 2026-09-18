import fs from "fs";
import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";
import { env } from "../config/env";
import { PedigreeNode } from "./pedigree";
import { resolveUploadPath } from "./upload";
import { generateQrPng } from "./qrcode";

function hexToRgb(hex: string | null | undefined, fallback = { r: 0.15, g: 0.23, b: 0.42 }) {
  if (!hex) return fallback;
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return fallback;
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  return { r, g, b };
}

async function embedImageAuto(pdfDoc: PDFDocument, filePath: string) {
  const bytes = fs.readFileSync(filePath);
  try {
    return await pdfDoc.embedJpg(bytes);
  } catch {
    return pdfDoc.embedPng(bytes);
  }
}

function verifyUrl(codigo: string) {
  return `${env.publicAppUrl}/verificar/${codigo}`;
}

function formatDate(date: Date | string | null | undefined) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("pt-BR");
}

function formatMoney(value: number | string) {
  return Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function drawWrappedText(
  page: PDFPage,
  text: string,
  opts: { x: number; y: number; font: PDFFont; size: number; maxWidth: number; lineHeight: number; color?: ReturnType<typeof rgb> }
): number {
  const words = text.split(/\s+/);
  let line = "";
  let y = opts.y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    const width = opts.font.widthOfTextAtSize(test, opts.size);
    if (width > opts.maxWidth && line) {
      page.drawText(line, { x: opts.x, y, size: opts.size, font: opts.font, color: opts.color ?? rgb(0.1, 0.1, 0.1) });
      line = word;
      y -= opts.lineHeight;
    } else {
      line = test;
    }
  }
  if (line) {
    page.drawText(line, { x: opts.x, y, size: opts.size, font: opts.font, color: opts.color ?? rgb(0.1, 0.1, 0.1) });
    y -= opts.lineHeight;
  }
  return y;
}

// -------------------------------------------------------------------------
// Certificado de origem (pedigree)
// -------------------------------------------------------------------------

export async function generatePedigreeCertificatePdf(params: {
  animal: any;
  criatorio: any;
  pedigree: PedigreeNode | null;
  codigoVerificacao: string;
  geracoes: number;
}): Promise<Uint8Array> {
  const { animal, criatorio, pedigree, codigoVerificacao, geracoes } = params;

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([842, 595]); // A4 paisagem
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const accent = hexToRgb(animal.sexo === "FEMEA" ? criatorio.corFemea : criatorio.corMacho);

  const { width, height } = page.getSize();

  // Moldura
  page.drawRectangle({ x: 16, y: 16, width: width - 32, height: height - 32, borderColor: rgb(accent.r, accent.g, accent.b), borderWidth: 3 });

  // Cabeçalho
  let logoBottom = height - 40;
  const logoPath = resolveUploadPath(criatorio.logoUrl);
  if (logoPath) {
    try {
      const img = await embedImageAuto(pdfDoc, logoPath);
      const logoHeight = 60;
      const logoWidth = (img.width / img.height) * logoHeight;
      page.drawImage(img, { x: 40, y: height - 100, width: logoWidth, height: logoHeight });
    } catch {
      /* ignore malformed image */
    }
  }

  page.drawText("CERTIFICADO DE ORIGEM", {
    x: width / 2 - fontBold.widthOfTextAtSize("CERTIFICADO DE ORIGEM", 22) / 2,
    y: height - 60,
    size: 22,
    font: fontBold,
    color: rgb(accent.r, accent.g, accent.b),
  });
  page.drawText(criatorio.nome, {
    x: width / 2 - font.widthOfTextAtSize(criatorio.nome, 13) / 2,
    y: height - 82,
    size: 13,
    font,
    color: rgb(0.25, 0.25, 0.25),
  });

  // Dados do animal
  let y = height - 130;
  const leftX = 40;
  const infoLines = [
    `Nome: ${animal.nome}`,
    `Espécie: ${animal.especie}${animal.mutacaoCor ? "  •  Mutação/Cor: " + animal.mutacaoCor : ""}`,
    `Sexo: ${animal.sexo}   Nascimento: ${formatDate(animal.dataNascimento)}`,
    `Anilha: ${animal.anilha ?? "-"}   Microchip: ${animal.microchip ?? "-"}`,
  ];
  for (const line of infoLines) {
    page.drawText(line, { x: leftX, y, size: 12, font, color: rgb(0.15, 0.15, 0.15) });
    y -= 20;
  }

  // Árvore genealógica (até 3-4 gerações)
  const treeTop = y - 20;
  page.drawText(`Árvore genealógica (${geracoes} gerações)`, { x: leftX, y: treeTop, size: 13, font: fontBold });

  function renderPedigree(node: PedigreeNode | null, depth: number, slot: number, top: number) {
    if (depth > geracoes) return;
    const colWidth = (width - 80) / geracoes;
    const x = leftX + (depth - 1) * colWidth;
    const totalSlots = Math.pow(2, depth - 1);
    const blockHeight = 240 / totalSlots;
    const yPos = top - blockHeight * slot - blockHeight / 2;

    const label = node ? `${node.nome}${node.anilha ? " (" + node.anilha + ")" : ""}` : "— não informado —";
    page.drawText(label.slice(0, 34), { x, y: yPos, size: 9.5, font: node ? font : font, color: node ? rgb(0.1, 0.1, 0.1) : rgb(0.6, 0.6, 0.6) });

    if (depth < geracoes) {
      renderPedigree(node?.pai ?? null, depth + 1, slot * 2, top);
      renderPedigree(node?.mae ?? null, depth + 1, slot * 2 + 1, top);
    }
  }
  renderPedigree(pedigree, 1, 0, treeTop - 20);

  // Dados legais no rodapé
  const rodape = [
    criatorio.registroIbama ? `IBAMA/SISPASS: ${criatorio.registroIbama}` : null,
    criatorio.registroClube ? `Clube: ${criatorio.registroClube}` : null,
    criatorio.registroFederacao ? `Federação: ${criatorio.registroFederacao}` : null,
  ]
    .filter(Boolean)
    .join("   •   ");
  if (rodape) {
    page.drawText(rodape, { x: leftX, y: 56, size: 9, font, color: rgb(0.35, 0.35, 0.35) });
  }
  page.drawText(`Emitido em ${formatDate(new Date())} • Código: ${codigoVerificacao}`, {
    x: leftX,
    y: 42,
    size: 9,
    font,
    color: rgb(0.35, 0.35, 0.35),
  });

  // QR Code de verificação pública
  const qrPng = await generateQrPng(verifyUrl(codigoVerificacao));
  const qrImage = await pdfDoc.embedPng(qrPng);
  const qrSize = 90;
  page.drawImage(qrImage, { x: width - qrSize - 40, y: 40, width: qrSize, height: qrSize });
  page.drawText("Escaneie para validar", {
    x: width - qrSize - 40,
    y: 30,
    size: 8,
    font,
    color: rgb(0.35, 0.35, 0.35),
  });

  return pdfDoc.save();
}

// -------------------------------------------------------------------------
// Crachá de gaiola/viveiro
// -------------------------------------------------------------------------

export async function generateCrachaPdf(params: {
  animal: any;
  criatorio: any;
  codigoVerificacao: string;
}): Promise<Uint8Array> {
  const { animal, criatorio, codigoVerificacao } = params;

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([283, 170]); // ~10x6cm
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const { width, height } = page.getSize();
  const accent = hexToRgb(animal.sexo === "FEMEA" ? criatorio.corFemea : criatorio.corMacho);

  page.drawRectangle({ x: 0, y: 0, width, height, color: rgb(accent.r, accent.g, accent.b) });
  page.drawRectangle({ x: 6, y: 6, width: width - 12, height: height - 12, color: rgb(1, 1, 1) });

  page.drawText(criatorio.nome.slice(0, 32), { x: 16, y: height - 24, size: 9, font, color: rgb(0.4, 0.4, 0.4) });
  page.drawText(animal.nome.slice(0, 22), { x: 16, y: height - 46, size: 16, font: fontBold, color: rgb(accent.r, accent.g, accent.b) });
  page.drawText(`${animal.especie}${animal.mutacaoCor ? " - " + animal.mutacaoCor : ""}`, {
    x: 16,
    y: height - 64,
    size: 10,
    font,
  });
  page.drawText(`Sexo: ${animal.sexo}`, { x: 16, y: height - 80, size: 10, font });
  page.drawText(`Anilha: ${animal.anilha ?? "-"}`, { x: 16, y: height - 96, size: 10, font });
  page.drawText(`Nasc.: ${formatDate(animal.dataNascimento)}`, { x: 16, y: height - 112, size: 10, font });

  const qrPng = await generateQrPng(verifyUrl(codigoVerificacao));
  const qrImage = await pdfDoc.embedPng(qrPng);
  const qrSize = 64;
  page.drawImage(qrImage, { x: width - qrSize - 16, y: 16, width: qrSize, height: qrSize });

  return pdfDoc.save();
}

// -------------------------------------------------------------------------
// Recibo e contrato de compra e venda
// -------------------------------------------------------------------------

export async function generateReciboPdf(venda: any): Promise<Uint8Array> {
  const { cliente, animal, criatorio } = venda;
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const { width, height } = page.getSize();

  page.drawText("RECIBO", { x: 40, y: height - 60, size: 22, font: fontBold });
  page.drawText(criatorio.nome, { x: 40, y: height - 84, size: 12, font, color: rgb(0.3, 0.3, 0.3) });

  const valor = formatMoney(venda.valor);
  const texto =
    `Recebi de ${cliente.nome}${cliente.cpfCnpj ? " (CPF/CNPJ " + cliente.cpfCnpj + ")" : ""} a quantia de ${valor} ` +
    `referente ${venda.tipo === "RESERVA" ? "à reserva" : "à venda"} do animal "${animal.nome}" (${animal.especie}` +
    `${animal.anilha ? ", anilha " + animal.anilha : ""}), pertencente ao plantel de ${criatorio.nome}.`;

  let y = height - 140;
  y = drawWrappedText(page, texto, { x: 40, y, font, size: 12, maxWidth: width - 80, lineHeight: 18 });

  y -= 20;
  page.drawText(`Valor total: ${valor}`, { x: 40, y, size: 12, font: fontBold });
  y -= 20;
  if (venda.sinal) {
    page.drawText(`Sinal recebido: ${formatMoney(venda.sinal)}`, { x: 40, y, size: 12, font });
    y -= 20;
  }
  page.drawText(`Status: ${venda.status}`, { x: 40, y, size: 12, font });
  y -= 20;
  page.drawText(`Data: ${formatDate(venda.dataVenda ?? venda.dataReserva ?? new Date())}`, { x: 40, y, size: 12, font });

  y -= 80;
  page.drawLine({ start: { x: 40, y }, end: { x: 300, y }, thickness: 1, color: rgb(0.4, 0.4, 0.4) });
  page.drawText(criatorio.nome, { x: 40, y: y - 14, size: 10, font });
  page.drawText("Assinatura do criatório", { x: 40, y: y - 28, size: 9, font, color: rgb(0.4, 0.4, 0.4) });

  return pdfDoc.save();
}

export async function generateContratoPdf(venda: any): Promise<Uint8Array> {
  const { cliente, animal, criatorio } = venda;
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const { width, height } = page.getSize();

  page.drawText("CONTRATO DE COMPRA E VENDA DE ANIMAL", {
    x: width / 2 - fontBold.widthOfTextAtSize("CONTRATO DE COMPRA E VENDA DE ANIMAL", 15) / 2,
    y: height - 60,
    size: 15,
    font: fontBold,
  });

  const paragrafos = [
    `VENDEDOR: ${criatorio.nome}${criatorio.registroIbama ? ", registro IBAMA/SISPASS " + criatorio.registroIbama : ""}${
      criatorio.registroClube ? ", clube " + criatorio.registroClube : ""
    }.`,
    `COMPRADOR: ${cliente.nome}${cliente.cpfCnpj ? ", CPF/CNPJ " + cliente.cpfCnpj : ""}${
      cliente.endereco ? ", residente em " + cliente.endereco : ""
    }${cliente.whatsapp ? ", contato " + cliente.whatsapp : ""}.`,
    `OBJETO: O VENDEDOR entrega ao COMPRADOR o animal "${animal.nome}", espécie ${animal.especie}` +
      `${animal.mutacaoCor ? ", mutação/cor " + animal.mutacaoCor : ""}${animal.anilha ? ", identificado pela anilha " + animal.anilha : ""}` +
      `${animal.microchip ? ", microchip " + animal.microchip : ""}, nascido em ${formatDate(animal.dataNascimento)}.`,
    `VALOR: ${formatMoney(venda.valor)}${venda.sinal ? `, dos quais ${formatMoney(venda.sinal)} já foram pagos a título de sinal` : ""}.`,
    `Ambas as partes declaram estar cientes das condições de saúde e origem do animal na data de ${formatDate(
      venda.dataVenda ?? venda.dataReserva ?? new Date()
    )}, e concordam com os termos acima.`,
  ];

  let y = height - 110;
  for (const p of paragrafos) {
    y = drawWrappedText(page, p, { x: 40, y, font, size: 11, maxWidth: width - 80, lineHeight: 16 });
    y -= 14;
  }

  y -= 60;
  page.drawLine({ start: { x: 40, y }, end: { x: 260, y }, thickness: 1 });
  page.drawText("Vendedor", { x: 40, y: y - 14, size: 9, font, color: rgb(0.4, 0.4, 0.4) });
  page.drawLine({ start: { x: 320, y }, end: { x: 540, y }, thickness: 1 });
  page.drawText("Comprador", { x: 320, y: y - 14, size: 9, font, color: rgb(0.4, 0.4, 0.4) });

  return pdfDoc.save();
}
