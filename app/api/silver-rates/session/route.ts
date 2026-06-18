import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-response';
import { requireAuth } from '@/lib/auth';
import { roundPKR } from '@/lib/currency-utils';
import { getCurrentSilverRate } from '@/lib/silver-rate-service';
import { setSessionSilverRateOverride } from '@/lib/silver-rate-session';

export async function PUT(request: NextRequest) {
  const auth = await requireAuth();
  if ('error' in auth) {
    return errorResponse(auth.error, auth.status);
  }

  try {
    const body = await request.json();
    const ratePerGram = roundPKR(Number(body?.ratePerGram));

    if (!Number.isFinite(ratePerGram) || ratePerGram <= 0) {
      return errorResponse('Silver rate must be a positive number', 400);
    }

    const override = await setSessionSilverRateOverride(ratePerGram);
    const effective = await getCurrentSilverRate();

    return successResponse({
      ratePerGram: effective.ratePerGram,
      currency: effective.currency,
      fetchedAt: effective.fetchedAt.toISOString(),
      fromCache: effective.fromCache,
      isSessionOverride: effective.isSessionOverride,
      lockedUntil: effective.lockedUntil,
      setAt: override.setAt,
      message:
        'Silver rate saved for this session. It will be used across the app and will not auto-refresh for 24 hours.',
    });
  } catch (error) {
    console.error('Failed to set session silver rate:', error);
    return errorResponse('Failed to save silver rate', 500);
  }
}
