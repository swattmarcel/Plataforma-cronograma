-- CreateEnum
CREATE TYPE "Plano" AS ENUM ('GRATIS', 'BASICO', 'PRO');

-- CreateEnum
CREATE TYPE "Sexo" AS ENUM ('MACHO', 'FEMEA', 'INDEFINIDO');

-- CreateEnum
CREATE TYPE "StatusAnimal" AS ENUM ('ATIVO', 'RESERVADO', 'VENDIDO', 'FALECIDO', 'FUGIU');

-- CreateEnum
CREATE TYPE "StatusNinhada" AS ENUM ('EM_ANDAMENTO', 'FINALIZADA');

-- CreateEnum
CREATE TYPE "StatusOvo" AS ENUM ('AGUARDANDO', 'GALADO', 'BRANCO', 'ECLODIU', 'FALHOU');

-- CreateEnum
CREATE TYPE "TipoFinanca" AS ENUM ('RECEITA', 'DESPESA');

-- CreateEnum
CREATE TYPE "TipoVenda" AS ENUM ('RESERVA', 'VENDA');

-- CreateEnum
CREATE TYPE "StatusVenda" AS ENUM ('RESERVADO', 'PAGO', 'ENTREGUE', 'CANCELADO');

-- CreateEnum
CREATE TYPE "TipoDocumento" AS ENUM ('CERTIFICADO_ORIGEM', 'CRACHA');

-- CreateEnum
CREATE TYPE "TipoEvento" AS ENUM ('NASCIMENTO_PREVISTO', 'SEPARACAO_FILHOTES', 'VACINA', 'MEDICACAO', 'LICENCA', 'OUTRO');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "plano" "Plano" NOT NULL DEFAULT 'GRATIS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Criatorio" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "logoUrl" TEXT,
    "corMacho" TEXT NOT NULL DEFAULT '#2563eb',
    "corFemea" TEXT NOT NULL DEFAULT '#db2777',
    "registroIbama" TEXT,
    "registroClube" TEXT,
    "registroFederacao" TEXT,
    "cidade" TEXT,
    "uf" TEXT,
    "whatsapp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Criatorio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Animal" (
    "id" TEXT NOT NULL,
    "criatorioId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "especie" TEXT NOT NULL,
    "mutacaoCor" TEXT,
    "anilha" TEXT,
    "microchip" TEXT,
    "sexo" "Sexo" NOT NULL DEFAULT 'INDEFINIDO',
    "dataNascimento" TIMESTAMP(3),
    "status" "StatusAnimal" NOT NULL DEFAULT 'ATIVO',
    "fotoUrl" TEXT,
    "observacoes" TEXT,
    "paiId" TEXT,
    "maeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Animal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Casal" (
    "id" TEXT NOT NULL,
    "criatorioId" TEXT NOT NULL,
    "apelido" TEXT,
    "machoId" TEXT NOT NULL,
    "femeaId" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "coeficienteConsanguinidade" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Casal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ninhada" (
    "id" TEXT NOT NULL,
    "criatorioId" TEXT NOT NULL,
    "casalId" TEXT NOT NULL,
    "dataCruza" TIMESTAMP(3),
    "dataPostura" TIMESTAMP(3),
    "diasIncubacao" INTEGER NOT NULL DEFAULT 21,
    "previsaoEclosao" TIMESTAMP(3),
    "status" "StatusNinhada" NOT NULL DEFAULT 'EM_ANDAMENTO',
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ninhada_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ovo" (
    "id" TEXT NOT NULL,
    "ninhadaId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "dataPostura" TIMESTAMP(3),
    "status" "StatusOvo" NOT NULL DEFAULT 'AGUARDANDO',
    "dataEclosao" TIMESTAMP(3),
    "animalNascidoId" TEXT,
    "observacoes" TEXT,

    CONSTRAINT "Ovo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Financa" (
    "id" TEXT NOT NULL,
    "criatorioId" TEXT NOT NULL,
    "tipo" "TipoFinanca" NOT NULL,
    "categoria" TEXT NOT NULL,
    "descricao" TEXT,
    "valor" DECIMAL(12,2) NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "animalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Financa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL,
    "criatorioId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cpfCnpj" TEXT,
    "endereco" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Venda" (
    "id" TEXT NOT NULL,
    "criatorioId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "animalId" TEXT NOT NULL,
    "tipo" "TipoVenda" NOT NULL DEFAULT 'RESERVA',
    "status" "StatusVenda" NOT NULL DEFAULT 'RESERVADO',
    "valor" DECIMAL(12,2) NOT NULL,
    "sinal" DECIMAL(12,2),
    "dataReserva" TIMESTAMP(3),
    "dataVenda" TIMESTAMP(3),
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Venda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Documento" (
    "id" TEXT NOT NULL,
    "criatorioId" TEXT NOT NULL,
    "animalId" TEXT NOT NULL,
    "tipo" "TipoDocumento" NOT NULL,
    "codigoVerificacao" TEXT NOT NULL,
    "geracoes" INTEGER NOT NULL DEFAULT 3,
    "arquivoUrl" TEXT,
    "geradoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Documento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evento" (
    "id" TEXT NOT NULL,
    "criatorioId" TEXT NOT NULL,
    "animalId" TEXT,
    "tipo" "TipoEvento" NOT NULL,
    "titulo" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "concluido" BOOLEAN NOT NULL DEFAULT false,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Criatorio_userId_key" ON "Criatorio"("userId");

-- CreateIndex
CREATE INDEX "Animal_criatorioId_idx" ON "Animal"("criatorioId");

-- CreateIndex
CREATE INDEX "Animal_paiId_idx" ON "Animal"("paiId");

-- CreateIndex
CREATE INDEX "Animal_maeId_idx" ON "Animal"("maeId");

-- CreateIndex
CREATE INDEX "Casal_criatorioId_idx" ON "Casal"("criatorioId");

-- CreateIndex
CREATE INDEX "Ninhada_criatorioId_idx" ON "Ninhada"("criatorioId");

-- CreateIndex
CREATE INDEX "Ninhada_casalId_idx" ON "Ninhada"("casalId");

-- CreateIndex
CREATE INDEX "Ovo_ninhadaId_idx" ON "Ovo"("ninhadaId");

-- CreateIndex
CREATE INDEX "Financa_criatorioId_idx" ON "Financa"("criatorioId");

-- CreateIndex
CREATE INDEX "Financa_animalId_idx" ON "Financa"("animalId");

-- CreateIndex
CREATE INDEX "Cliente_criatorioId_idx" ON "Cliente"("criatorioId");

-- CreateIndex
CREATE INDEX "Venda_criatorioId_idx" ON "Venda"("criatorioId");

-- CreateIndex
CREATE INDEX "Venda_clienteId_idx" ON "Venda"("clienteId");

-- CreateIndex
CREATE INDEX "Venda_animalId_idx" ON "Venda"("animalId");

-- CreateIndex
CREATE UNIQUE INDEX "Documento_codigoVerificacao_key" ON "Documento"("codigoVerificacao");

-- CreateIndex
CREATE INDEX "Documento_criatorioId_idx" ON "Documento"("criatorioId");

-- CreateIndex
CREATE INDEX "Documento_animalId_idx" ON "Documento"("animalId");

-- CreateIndex
CREATE INDEX "Evento_criatorioId_idx" ON "Evento"("criatorioId");

-- CreateIndex
CREATE INDEX "Evento_data_idx" ON "Evento"("data");

-- AddForeignKey
ALTER TABLE "Criatorio" ADD CONSTRAINT "Criatorio_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Animal" ADD CONSTRAINT "Animal_criatorioId_fkey" FOREIGN KEY ("criatorioId") REFERENCES "Criatorio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Animal" ADD CONSTRAINT "Animal_paiId_fkey" FOREIGN KEY ("paiId") REFERENCES "Animal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Animal" ADD CONSTRAINT "Animal_maeId_fkey" FOREIGN KEY ("maeId") REFERENCES "Animal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Casal" ADD CONSTRAINT "Casal_criatorioId_fkey" FOREIGN KEY ("criatorioId") REFERENCES "Criatorio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Casal" ADD CONSTRAINT "Casal_machoId_fkey" FOREIGN KEY ("machoId") REFERENCES "Animal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Casal" ADD CONSTRAINT "Casal_femeaId_fkey" FOREIGN KEY ("femeaId") REFERENCES "Animal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ninhada" ADD CONSTRAINT "Ninhada_criatorioId_fkey" FOREIGN KEY ("criatorioId") REFERENCES "Criatorio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ninhada" ADD CONSTRAINT "Ninhada_casalId_fkey" FOREIGN KEY ("casalId") REFERENCES "Casal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ovo" ADD CONSTRAINT "Ovo_ninhadaId_fkey" FOREIGN KEY ("ninhadaId") REFERENCES "Ninhada"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ovo" ADD CONSTRAINT "Ovo_animalNascidoId_fkey" FOREIGN KEY ("animalNascidoId") REFERENCES "Animal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Financa" ADD CONSTRAINT "Financa_criatorioId_fkey" FOREIGN KEY ("criatorioId") REFERENCES "Criatorio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Financa" ADD CONSTRAINT "Financa_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cliente" ADD CONSTRAINT "Cliente_criatorioId_fkey" FOREIGN KEY ("criatorioId") REFERENCES "Criatorio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venda" ADD CONSTRAINT "Venda_criatorioId_fkey" FOREIGN KEY ("criatorioId") REFERENCES "Criatorio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venda" ADD CONSTRAINT "Venda_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venda" ADD CONSTRAINT "Venda_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_criatorioId_fkey" FOREIGN KEY ("criatorioId") REFERENCES "Criatorio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evento" ADD CONSTRAINT "Evento_criatorioId_fkey" FOREIGN KEY ("criatorioId") REFERENCES "Criatorio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evento" ADD CONSTRAINT "Evento_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
