-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "nameKey" TEXT;

-- Backfill: nome comparável (minúsculas, sem os espaços das pontas).
-- A consulta de duplicatas deu 0 linhas no finance_dev e no finance (26/11/2026).
UPDATE "Category" SET "nameKey" = lower(btrim("name"));

-- CreateIndex
CREATE UNIQUE INDEX "Category_userId_nameKey_key" ON "Category"("userId", "nameKey");
