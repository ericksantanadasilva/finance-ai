import { NextResponse } from 'next/server';
import type { z } from 'zod';

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
