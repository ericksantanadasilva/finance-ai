import { NextResponse } from 'next/server';
import type { z } from 'zod';

export type ParseResult<T> =
  | { data: T; errorResponse: null }
  | { data: null; errorResponse: NextResponse };

/**
 * Lê o body JSON e valida com o schema. Em caso de falha devolve um 400 com
 * os campos inválidos (`issues`), no mesmo formato de erro das outras rotas.
 */
export async function parseJsonBody<S extends z.ZodType>(
  request: Request,
  schema: S,
): Promise<ParseResult<z.infer<S>>> {
  const body: unknown = await request.json().catch(() => undefined);
  const result = schema.safeParse(body);

  if (!result.success) {
    return {
      data: null,
      errorResponse: NextResponse.json(
        {
          error: 'Invalid request body',
          issues: result.error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 },
      ),
    };
  }

  return { data: result.data, errorResponse: null };
}
