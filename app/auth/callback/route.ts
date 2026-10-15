import { createClient } from '@/lib/supabase/server';
import { ensureDbUser } from '@/lib/ensure-user';

// Location relativo: o navegador resolve contra o endereço que ele realmente
// acessou (domínio ou IP), sem confiar no header Host da requisição.
function redirectTo(path: string) {
  return new Response(null, { status: 307, headers: { Location: path } });
}

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get('code');

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      await ensureDbUser(data.user);
      return redirectTo('/Dashboard');
    }
  }

  return redirectTo('/?error=auth');
}
