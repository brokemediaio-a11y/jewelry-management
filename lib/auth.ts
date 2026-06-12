import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { SESSION_COOKIE, SESSION_MAX_AGE } from '@/lib/auth-constants';

export { SESSION_COOKIE } from '@/lib/auth-constants';

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('AUTH_SECRET environment variable is not set');
  }
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(userId: string): Promise<string> {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .setIssuedAt()
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<{ userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    const userId = payload.userId;
    if (typeof userId !== 'string' || !userId) return null;
    return { userId };
  } catch {
    return null;
  }
}

export async function createSession(userId: string): Promise<void> {
  const token = await createSessionToken(userId);
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
  | { error: string; status: 401 };

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
