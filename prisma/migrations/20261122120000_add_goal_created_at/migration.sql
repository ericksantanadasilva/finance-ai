-- AlterTable: data de criação da meta (início do ritmo no app mobile)
ALTER TABLE "Goal" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Backfill: as metas existentes recebem o instante de criação embutido no id.
-- O id é cuid v1: "c" + 8 caracteres em base 36 com o instante em ms.
-- Ids fora desse formato ficam com a data desta migration.
UPDATE "Goal"
SET "createdAt" = to_timestamp(
  (
    SELECT sum(
      (CASE WHEN ch ~ '[0-9]' THEN ascii(ch) - 48 ELSE ascii(ch) - 87 END)
      * power(36::numeric, 8 - pos)
    )
    FROM unnest(string_to_array(substring("id" FROM 2 FOR 8), NULL))
      WITH ORDINALITY AS digits(ch, pos)
  ) / 1000.0
)
WHERE "id" ~ '^c[a-z0-9]{24}$';
