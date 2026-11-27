import { PrismaClient } from '@/prisma/generated/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * Erro do Prisma de violação de unique (P2002). Compara o `code` em vez de usar
 * `instanceof`: no Next o client gerado pode ser carregado duas vezes.
 */
export function isUniqueViolation(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'P2002'
  );
}
