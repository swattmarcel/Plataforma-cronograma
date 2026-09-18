# Plataforma Criadouro

Sistema de gestão para criadores de animais (aves, cães, gatos, etc.), substituindo planilhas e
anotações em papel. Controla plantel, genealogia/consanguinidade, reprodução (ninhadas), emissão de
documentos (certificados de origem em PDF com QR Code de validação pública), financeiro e vendas.

## Estrutura (monorepo)

```
apps/
  api/   Backend: Node.js + Express + TypeScript + Prisma + PostgreSQL
  web/   Frontend: React + Vite + TypeScript + Tailwind (PWA - instalável no celular)
```

## Módulos implementados

- **Dashboard**: resumo do plantel (machos/fêmeas/filhotes) e alertas (nascimentos previstos, fim
  de choco, vacinas/medicações, licenças a vencer).
- **Plantel (Animais)**: cadastro completo (espécie, mutação/cor, anilha/microchip, sexo, nascimento,
  status), foto, árvore genealógica automática a partir de Pai/Mãe, cálculo do coeficiente de
  consanguinidade (Wright) ao formar casais ou registrar filhotes.
- **Reprodução**: formação de casais, acompanhamento de postura (data da cruza, ovos, previsão de
  eclosão, ovos galados x brancos), estatísticas por reprodutor.
- **Documentos**: geração de PDF do certificado de origem (pedigree 3-4 gerações + logo do
  criatório) e crachás de gaiola coloridos por sexo, cada um com QR Code que abre uma página pública
  de verificação de autenticidade.
- **Financeiro & Vendas**: despesas/receitas por categoria, custo por animal e lucro líquido,
  cadastro de clientes (CRM), reservas/vendas de filhotes com geração de recibo e contrato.
- **Configurações (white-label)**: logo do criatório, cores dos crachás, dados legais
  (IBAMA/SISPASS, clube, federação) exibidos nos rodapés dos PDFs.
- **Saúde**: fichas de saúde por ave (doenças, tratamentos, vacinas, observações) e medicações com
  horários e lembrete opcional por WhatsApp 5 minutos antes da dose (ver observação abaixo).
- **Competições**: histórico de campeonatos por ave (evento, cantos, colocação, observações) com
  upload de áudio/vídeo.
- **Contador de Cantos**: sessão manual (um toque por canto) ou automática (detecção de picos de
  volume pelo microfone — não é reconhecimento de espécie/canto por IA), com cronômetro, placar e
  histórico de sessões.
- **Transferências entre criadouros**: o destinatário gera um código temporário; quem transfere
  informa o código e escolhe a ave do próprio plantel para confirmar — genealogia, saúde e
  competições acompanham a ave para o novo dono.
- **Importação SISPASS**: upload do PDF exportado do SISPASS/IBAMA, leitura heurística (anilha,
  espécie, sexo), tela de conferência/edição e importação em lote para o plantel.
- **Personalização de certificados/crachás**: modelos salvos por criatório com cor principal, cor de
  fundo, cor do texto, fonte, fundo personalizado e quais campos aparecem (logo, QR, registros
  legais); é possível marcar um modelo como padrão por tipo de documento.

### Observação sobre o WhatsApp

O envio de lembretes de medicação por WhatsApp depende de um provedor externo (Meta Cloud API,
Twilio, etc.) que não está incluído neste projeto. Configure `WHATSAPP_API_URL` e
`WHATSAPP_API_TOKEN` em `apps/api/.env` para ativar o envio real; sem essas variáveis, o lembrete é
apenas registrado no log do servidor. O disparo em si acontece via
`POST /internal/lembretes/processar` (protegido por `INTERNAL_CRON_SECRET`), pensado para ser
chamado por um cron externo a cada minuto.

## Rodando localmente

### 1. Banco de dados

```bash
# Postgres precisa estar rodando; crie o banco e ajuste apps/api/.env
createdb criadouro_dev
```

### 2. Backend

```bash
cd apps/api
cp .env.example .env   # ajuste DATABASE_URL e JWT_SECRET
npm install
npx prisma migrate dev
npm run dev             # http://localhost:3333
```

### 3. Frontend

```bash
cd apps/web
npm install
npm run dev              # http://localhost:5173
```

O frontend é um PWA: no celular, abra no navegador e use "Adicionar à tela inicial" para instalar
como app.

## Stack

- Backend: Node.js, Express, TypeScript, Prisma ORM, PostgreSQL, JWT, bcrypt, pdf-lib, qrcode, multer,
  pdf-parse, nanoid
- Frontend: React, Vite, TypeScript, Tailwind CSS, React Router, vite-plugin-pwa, axios
- Modelo de negócio sugerido: SaaS com assinatura recorrente (integração de pagamento — Mercado
  Pago/Stripe/Asaas — não incluída neste MVP, ponto de extensão em `apps/api/src/modules/billing`).
