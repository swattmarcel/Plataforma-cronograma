-- CreateEnum
CREATE TYPE "TipoRegistroSaude" AS ENUM ('DOENCA', 'TRATAMENTO', 'VACINA', 'OBSERVACAO');

-- CreateEnum
CREATE TYPE "ModoContagem" AS ENUM ('AUTOMATICO', 'MANUAL');

-- CreateEnum
CREATE TYPE "StatusTransferencia" AS ENUM ('ATIVO', 'USADO', 'CANCELADO', 'EXPIRADO');

-- AlterTable
ALTER TABLE "Documento" ADD COLUMN     "templateId" TEXT;

-- CreateTable
CREATE TABLE "DocumentoTemplate" (
    "id" TEXT NOT NULL,
    "criatorioId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "TipoDocumento" NOT NULL,
    "corPrimaria" TEXT NOT NULL DEFAULT '#0f766e',
    "corFundo" TEXT NOT NULL DEFAULT '#ffffff',
    "corTexto" TEXT NOT NULL DEFAULT '#111827',
    "fonte" TEXT NOT NULL DEFAULT 'helvetica',
    "mostrarLogo" BOOLEAN NOT NULL DEFAULT true,
    "mostrarQr" BOOLEAN NOT NULL DEFAULT true,
    "mostrarRegistrosLegais" BOOLEAN NOT NULL DEFAULT true,
    "backgroundUrl" TEXT,
    "padrao" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentoTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistroSaude" (
    "id" TEXT NOT NULL,
    "criatorioId" TEXT NOT NULL,
    "animalId" TEXT NOT NULL,
    "tipo" "TipoRegistroSaude" NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "data" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegistroSaude_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Medicacao" (
    "id" TEXT NOT NULL,
    "criatorioId" TEXT NOT NULL,
    "animalId" TEXT NOT NULL,
    "medicamento" TEXT NOT NULL,
    "dose" TEXT,
    "horarios" TEXT[],
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "whatsappAtivo" BOOLEAN NOT NULL DEFAULT false,
    "ultimoLembreteEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Medicacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Competicao" (
    "id" TEXT NOT NULL,
    "criatorioId" TEXT NOT NULL,
    "animalId" TEXT NOT NULL,
    "evento" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "quantidadeCantos" INTEGER,
    "colocacao" TEXT,
    "observacoes" TEXT,
    "midias" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Competicao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessaoCanto" (
    "id" TEXT NOT NULL,
    "criatorioId" TEXT NOT NULL,
    "animalId" TEXT NOT NULL,
    "modo" "ModoContagem" NOT NULL DEFAULT 'MANUAL',
    "quantidadeCantos" INTEGER NOT NULL DEFAULT 0,
    "duracaoSegundos" INTEGER NOT NULL DEFAULT 0,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observacoes" TEXT,

    CONSTRAINT "SessaoCanto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransferenciaCodigo" (
    "id" TEXT NOT NULL,
    "criatorioId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "status" "StatusTransferencia" NOT NULL DEFAULT 'ATIVO',
    "animalId" TEXT,
    "origemCriatorioNome" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "usadoEm" TIMESTAMP(3),

    CONSTRAINT "TransferenciaCodigo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DocumentoTemplate_criatorioId_idx" ON "DocumentoTemplate"("criatorioId");

-- CreateIndex
CREATE INDEX "RegistroSaude_criatorioId_idx" ON "RegistroSaude"("criatorioId");

-- CreateIndex
CREATE INDEX "RegistroSaude_animalId_idx" ON "RegistroSaude"("animalId");

-- CreateIndex
CREATE INDEX "Medicacao_criatorioId_idx" ON "Medicacao"("criatorioId");

-- CreateIndex
CREATE INDEX "Medicacao_animalId_idx" ON "Medicacao"("animalId");

-- CreateIndex
CREATE INDEX "Competicao_criatorioId_idx" ON "Competicao"("criatorioId");

-- CreateIndex
CREATE INDEX "Competicao_animalId_idx" ON "Competicao"("animalId");

-- CreateIndex
CREATE INDEX "SessaoCanto_criatorioId_idx" ON "SessaoCanto"("criatorioId");

-- CreateIndex
CREATE INDEX "SessaoCanto_animalId_idx" ON "SessaoCanto"("animalId");

-- CreateIndex
CREATE UNIQUE INDEX "TransferenciaCodigo_codigo_key" ON "TransferenciaCodigo"("codigo");

-- CreateIndex
CREATE INDEX "TransferenciaCodigo_criatorioId_idx" ON "TransferenciaCodigo"("criatorioId");

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "DocumentoTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentoTemplate" ADD CONSTRAINT "DocumentoTemplate_criatorioId_fkey" FOREIGN KEY ("criatorioId") REFERENCES "Criatorio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroSaude" ADD CONSTRAINT "RegistroSaude_criatorioId_fkey" FOREIGN KEY ("criatorioId") REFERENCES "Criatorio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroSaude" ADD CONSTRAINT "RegistroSaude_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Medicacao" ADD CONSTRAINT "Medicacao_criatorioId_fkey" FOREIGN KEY ("criatorioId") REFERENCES "Criatorio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Medicacao" ADD CONSTRAINT "Medicacao_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Competicao" ADD CONSTRAINT "Competicao_criatorioId_fkey" FOREIGN KEY ("criatorioId") REFERENCES "Criatorio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Competicao" ADD CONSTRAINT "Competicao_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessaoCanto" ADD CONSTRAINT "SessaoCanto_criatorioId_fkey" FOREIGN KEY ("criatorioId") REFERENCES "Criatorio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessaoCanto" ADD CONSTRAINT "SessaoCanto_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferenciaCodigo" ADD CONSTRAINT "TransferenciaCodigo_criatorioId_fkey" FOREIGN KEY ("criatorioId") REFERENCES "Criatorio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransferenciaCodigo" ADD CONSTRAINT "TransferenciaCodigo_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
