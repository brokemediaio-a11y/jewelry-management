import { jwtVerify, SignJWT } from "jose";
import type { UserRole } from "@prisma/client";
import { SESSION_MAX_AGE } from "@/lib/auth-constants";

export type SessionTokenPayload = {
  userId: string;
  role: UserRole;
};

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET environment variable is not set");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(
  userId: string,
  role: UserRole
): Promise<string> {
  return new SignJWT({ userId, role })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .setIssuedAt()
    .sign(getSecretKey());
}

export async function verifySessionToken(
  token: string
): Promise<SessionTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    const userId = payload.userId;
    const role = payload.role;
    if (typeof userId !== "string" || !userId) return null;
    if (typeof role !== "string" || !role) return null;
    return { userId, role: role as UserRole };
  } catch {
    return null;
  }
}
