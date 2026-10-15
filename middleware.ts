import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 1. Definir rotas protegidas (Dashboard, Categorias, Chat, etc)
  const isProtectedRoute =
    request.nextUrl.pathname.startsWith('/Dashboard') ||
    request.nextUrl.pathname.startsWith('/Categories') ||
    request.nextUrl.pathname.startsWith('/Transactions') ||
    request.nextUrl.pathname.startsWith('/Recurring') ||
    request.nextUrl.pathname.startsWith('/Goals') ||
    request.nextUrl.pathname.startsWith('/Settings') ||
    request.nextUrl.pathname.startsWith('/Chat') ||
    request.nextUrl.pathname.startsWith('/import');

  // 2. Se for rota protegida e NÃO tiver usuário, manda pro Login
  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 3. Se o usuário estiver logado e tentar ir pro Login/Register, manda pro Dashboard
  if (
    user &&
    (request.nextUrl.pathname === '/' ||
      request.nextUrl.pathname === '/register')
  ) {
    return NextResponse.redirect(new URL('/Dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - auth/callback (important for social login)
     */
    '/((?!api|_next/static|_next/image|assets|favicon.ico|sw.js|auth/callback).*)',
  ],
};
