import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { SESSION_COOKIE, SESSION_MAX_AGE } from '@/lib/auth-constants';
import { createSessionToken, verifySessionToken } from '@/lib/session-token';

export { SESSION_COOKIE } from '@/lib/auth-constants';

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) {
    throw new Error('User not found');
  }

  const token = await createSessionToken(userId, user.role);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, name: true, email: true, role: true },
  });

  return user;
}

type AuthResult =
  | { session: SessionUser }
  | { error: string; status: 401 | 403 };

type AdminResult =
  | { session: SessionUser }
  | { error: string; status: 401 | 403 };

export async function requireAuth(): Promise<AuthResult> {
  const session = await getSession();
  if (!session) {
    return { error: 'Unauthorized', status: 401 };
  }
  return { session };
}

export async function requireAdmin(): Promise<AdminResult> {
  const session = await getSession();
  if (!session) {
    return { error: 'Unauthorized', status: 401 };
  }
  if (session.role !== UserRole.ADMIN) {
    return { error: 'Forbidden: Admin access required', status: 403 };
  }
  return { session };
}

export async function requireFullAccess(): Promise<AuthResult> {
  const auth = await requireAuth();
  if ('error' in auth) return auth;
  if (
    auth.session.role !== UserRole.ADMIN &&
    auth.session.role !== UserRole.STAFF
  ) {
    return { error: 'Forbidden', status: 403 };
  }
  return auth;
}
