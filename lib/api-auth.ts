import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

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

/**
 * Valida a sessão do usuário autenticado no Supabase.
 * Suporta tanto sessões baseadas em cookies (Web App) quanto tokens JWT no header Authorization Bearer (Mobile / Expo).
 */
export async function validateUserSession(
  request?: Request,
): Promise<AuthSessionResult> {
  // 1. Verificação via Bearer Token no cabeçalho Authorization (útil para Mobile / React Native / chamadas API)
  if (request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '').trim();
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (supabaseUrl && supabaseAnonKey && token) {
        const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser(token);

        if (!error && user) {
          return {
            user: { id: user.id, email: user.email },
            errorResponse: null,
          };
        }
      }
    }
  }

  // 2. Verificação padrão via Cookies da sessão (Web App Next.js)
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return {
        user: null,
        errorResponse: NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 },
        ),
      };
    }

    return {
      user: { id: user.id, email: user.email },
      errorResponse: null,
    };
  } catch (err) {
    console.error('Erro na validação de sessão Supabase:', err);
    return {
      user: null,
      errorResponse: NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      ),
    };
  }
}
