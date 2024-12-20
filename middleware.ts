import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const session = request.cookies.get('session');

  // Jika mencoba mengakses halaman admin tanpa session
  if (!session?.value && request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Jika sudah ada session dan mencoba mengakses login
  if (session?.value && request.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/login']
}; 