import { cookies } from 'next/headers';
import { SESSION_MAX_AGE } from '@/lib/auth-constants';
import {
  SILVER_RATE_LOCK_MS,
  SILVER_RATE_SESSION_COOKIE,
} from '@/lib/silver-rate-constants';

export type SessionSilverRateOverride = {
  ratePerGram: number;
  setAt: string;
  lockedUntil: string;
};

export function isOverrideActive(override: SessionSilverRateOverride): boolean {
  return new Date(override.lockedUntil).getTime() > Date.now();
}

export async function getSessionSilverRateOverride(): Promise<SessionSilverRateOverride | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SILVER_RATE_SESSION_COOKIE)?.value;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as SessionSilverRateOverride;
    if (!Number.isFinite(parsed.ratePerGram) || !parsed.lockedUntil) {
      cookieStore.delete(SILVER_RATE_SESSION_COOKIE);
      return null;
    }
    if (!isOverrideActive(parsed)) {
      cookieStore.delete(SILVER_RATE_SESSION_COOKIE);
      return null;
    }
    return parsed;
  } catch {
    cookieStore.delete(SILVER_RATE_SESSION_COOKIE);
    return null;
  }
}

export async function setSessionSilverRateOverride(ratePerGram: number): Promise<SessionSilverRateOverride> {
  const cookieStore = await cookies();
  const now = new Date();
  const lockedUntil = new Date(now.getTime() + SILVER_RATE_LOCK_MS);

  const payload: SessionSilverRateOverride = {
    ratePerGram,
    setAt: now.toISOString(),
    lockedUntil: lockedUntil.toISOString(),
  };

  cookieStore.set(SILVER_RATE_SESSION_COOKIE, JSON.stringify(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });

  return payload;
}

export async function clearSessionSilverRateOverride(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SILVER_RATE_SESSION_COOKIE);
}
