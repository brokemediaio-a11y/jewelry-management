import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { loginSchema } from '@/lib/validations';
import { createSession, verifyPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = loginSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user || !(await verifyPassword(data.password, user.passwordHash))) {
      return errorResponse('Invalid email or password', 401);
    }

    await createSession(user.id);

    return successResponse({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'ZodError') {
      const zodError = error as { errors?: Array<{ message: string }> };
      return errorResponse(zodError.errors?.[0]?.message || 'Validation error', 400);
    }
    console.error('Login failed:', error);
    return errorResponse('Failed to login', 500);
  }
}
