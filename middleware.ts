import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE } from '@/lib/auth-constants';
import { verifySessionToken } from '@/lib/session-token';
import {
  getDefaultDashboardPath,
  isApiAllowedForRole,
  isPageAllowedForRole,
} from '@/lib/role-access';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const payload = token ? await verifySessionToken(token) : null;
  const authenticated = !!payload;
  const role = payload?.role;

  if (pathname.startsWith('/api/')) {
    if (pathname === '/api/auth/login') {
      return NextResponse.next();
    }
    if (!authenticated || !role) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (!isApiAllowedForRole(pathname, request.method, role)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.next();
  }

  if (pathname.startsWith('/dashboard')) {
    if (!authenticated || !role) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (!isPageAllowedForRole(pathname, role)) {
      return NextResponse.redirect(new URL(getDefaultDashboardPath(role), request.url));
    }
  }

  if (pathname === '/login' && authenticated && role) {
    return NextResponse.redirect(new URL(getDefaultDashboardPath(role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/api/:path*'],
};
