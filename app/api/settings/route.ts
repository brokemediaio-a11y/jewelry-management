import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { requireAdmin } from '@/lib/auth';
import { z } from 'zod';

const updateSettingSchema = z.object({
  key: z.string().min(1),
  value: z.string(),
  description: z.string().optional(),
});

const updateMultipleSettingsSchema = z.object({
  settings: z.record(z.string(), z.string()),
});

export async function GET() {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) {
      return errorResponse(auth.error, auth.status);
    }

    const settings = await prisma.settings.findMany({
      orderBy: { key: 'asc' },
    });

    // Convert to key-value map
    const settingsMap: Record<string, string> = {};
    settings.forEach((setting) => {
      settingsMap[setting.key] = setting.value;
    });

    return successResponse(settingsMap);
  } catch (error) {
    return errorResponse('Failed to fetch settings', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) {
      return errorResponse(auth.error, auth.status);
    }

    const body = await request.json();
    const data = updateMultipleSettingsSchema.parse(body);

    // Update or create each setting
    const updates = Object.entries(data.settings).map(([key, value]) =>
      prisma.settings.upsert({
        where: { key },
        update: { value, updatedAt: new Date() },
        create: { key, value },
      })
    );

    await Promise.all(updates);

    return successResponse({ message: 'Settings updated successfully' });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return errorResponse(error.errors[0].message, 400);
    }
    return errorResponse('Failed to update settings', 500);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) {
      return errorResponse(auth.error, auth.status);
    }

    const body = await request.json();
    const data = updateSettingSchema.parse(body);

    const setting = await prisma.settings.upsert({
      where: { key: data.key },
      update: {
        value: data.value,
        description: data.description,
        updatedAt: new Date(),
      },
      create: {
        key: data.key,
        value: data.value,
        description: data.description,
      },
    });

    return successResponse(setting);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return errorResponse(error.errors[0].message, 400);
    }
    return errorResponse('Failed to update setting', 500);
  }
}

