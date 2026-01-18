import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  // Pega o host dos headers para garantir que estamos usando o IP se o acesso for via IP
  const host = request.headers.get('host');
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  const currentOrigin = `${protocol}://${host}`;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Redireciona usando a origem capturada do header
      return NextResponse.redirect(`${currentOrigin}/Dashboard`);
    }
  }

  return NextResponse.redirect(
    `${currentOrigin}/login?error=failed_to_authenticate`,
  );
}
