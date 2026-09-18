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

- Backend: Node.js, Express, TypeScript, Prisma ORM, PostgreSQL, JWT, bcrypt, pdf-lib, qrcode, multer
- Frontend: React, Vite, TypeScript, Tailwind CSS, React Router, vite-plugin-pwa, axios
- Modelo de negócio sugerido: SaaS com assinatura recorrente (integração de pagamento — Mercado
  Pago/Stripe/Asaas — não incluída neste MVP, ponto de extensão em `apps/api/src/modules/billing`).
