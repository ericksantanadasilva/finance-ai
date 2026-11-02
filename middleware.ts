import { getToken } from 'next-auth/jwt';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });

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
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 3. Se o usuário estiver logado e tentar ir pro Login, manda pro Dashboard
  if (token && request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/Dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (inclui /api/auth do next-auth)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|assets|favicon.ico|sw.js).*)',
  ],
};
