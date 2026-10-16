-- Escrita à mão: o SQL gerado pelo Prisma faria DROP COLUMN + ADD COLUMN e apagaria
-- os tipos existentes. Aqui a coluna é convertida mantendo os valores.
BEGIN;

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('income', 'expense');

-- AlterTable
ALTER TABLE "Category" ALTER COLUMN "type" TYPE "TransactionType" USING "type"::"TransactionType";

-- AlterTable
ALTER TABLE "RecurringRule" ALTER COLUMN "type" TYPE "TransactionType" USING "type"::"TransactionType";

-- AlterTable
ALTER TABLE "Transaction" ALTER COLUMN "type" TYPE "TransactionType" USING "type"::"TransactionType";

COMMIT;
