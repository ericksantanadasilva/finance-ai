import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@/prisma/generated/client';

/** Dinheiro: > 0, até 2 casas e dentro do Decimal(10, 2) do banco. */
export const moneySchema = z
  .number()
  .positive()
  .max(99999999.99)
  // Compara em centavos: multipleOf(0.01) falha com ponto flutuante (ex.: 152.9)
  .refine((v) => Math.abs(Math.round(v * 100) - v * 100) < 1e-6, {
    message: 'Must have at most 2 decimal places',
  });

/** Data sem horário "YYYY-MM-DD", existente no calendário (rejeita 2026-02-30). */
export const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (value) => {
      const [y, m, d] = value.split('-').map(Number);
      const date = new Date(Date.UTC(y, m - 1, d));
      return (
        date.getUTCFullYear() === y &&
        date.getUTCMonth() === m - 1 &&
        date.getUTCDate() === d
      );
    },
    { message: 'Invalid date' },
  );

/** Mês "YYYY-MM" (01 a 12). */
export const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);

/** 404 para id que não existe ou é de outro usuário (não revela qual dos dois). */
export function notFoundResponse() {
  return NextResponse.json({ error: 'Not Found' }, { status: 404 });
}

/** Erro do Prisma quando o update/delete por { id, userId } não encontra o registro. */
export function isRecordNotFound(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2025'
  );
}

export type ParseResult<T> =
  | { data: T; errorResponse: null }
  | { data: null; errorResponse: NextResponse };

/** 400 com os campos inválidos (`issues`), no mesmo formato de erro das outras rotas. */
function invalidResponse(message: string, error: z.ZodError) {
  return NextResponse.json(
    {
      error: message,
      issues: error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    },
    { status: 400 },
  );
}

/** Lê o body JSON e valida com o schema. */
export async function parseJsonBody<S extends z.ZodType>(
  request: Request,
  schema: S,
): Promise<ParseResult<z.infer<S>>> {
  const body: unknown = await request.json().catch(() => undefined);
  const result = schema.safeParse(body);

  if (!result.success) {
    return {
      data: null,
      errorResponse: invalidResponse('Invalid request body', result.error),
    };
  }
  return { data: result.data, errorResponse: null };
}

/**
 * Valida a query string com o schema. Parâmetros vazios (`?q=`) são ignorados,
 * para que `z.coerce.number()` não transforme "" em 0.
 */
export function parseSearchParams<S extends z.ZodType>(
  request: Request,
  schema: S,
): ParseResult<z.infer<S>> {
  const params = Object.fromEntries(
    [...new URL(request.url).searchParams].filter(([, value]) => value !== ''),
  );
  const result = schema.safeParse(params);

  if (!result.success) {
    return {
      data: null,
      errorResponse: invalidResponse('Invalid query parameters', result.error),
    };
  }
  return { data: result.data, errorResponse: null };
}
