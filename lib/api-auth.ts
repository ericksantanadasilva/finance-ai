import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';

/**
 * Valida a chave de API fornecida no header `x-api-key` para integrações externas (ex: n8n).
 * Retorna `null` se for válida ou uma resposta `NextResponse` 401 caso seja inválida.
 */
export function validateApiKey(request: Request): NextResponse | null {
  const apiKey = request.headers.get('x-api-key');
  const internalSecret = process.env.N8N_INTERNAL_SECRET;

  if (!internalSecret || !apiKey || apiKey !== internalSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return null;
}

export type AuthSessionResult =
  | { user: { id: string; email?: string | null }; errorResponse: null }
  | { user: null; errorResponse: NextResponse };

/** Valida a sessão do usuário autenticado (cookie do next-auth). */
export async function validateUserSession(): Promise<AuthSessionResult> {
  const user = await getSessionUser();

  if (!user) {
    return {
      user: null,
      errorResponse: NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      ),
    };
  }

  return { user: { id: user.id, email: user.email }, errorResponse: null };
}
