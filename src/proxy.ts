import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const PUBLIC_PATHS = ['/', '/login', '/register', '/verify-otp', '/dashboard', '/health-calc', '/terms', '/api/auth', '/api/ads', '/api/health-articles', '/api/webauthn'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_PATHS.some((p) => {
    if (p === '/') return pathname === '/';
    return pathname.startsWith(p);
  });
  if (isPublic) return NextResponse.next();

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json|icon-|uploads).*)'],
};
