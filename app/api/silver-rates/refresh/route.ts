import { successResponse, errorResponse } from '@/lib/api-response';
import { requireAdmin } from '@/lib/auth';
import { fetchAndCacheSilverRate, getCurrentSilverRate } from '@/lib/silver-rate-service';
import { getSessionSilverRateOverride } from '@/lib/silver-rate-session';

export async function POST() {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) {
      return errorResponse(auth.error, auth.status);
    }

    const override = await getSessionSilverRateOverride();
    if (override) {
      const effective = await getCurrentSilverRate();
      return successResponse({
        ...effective,
        fetchedAt: effective.fetchedAt.toISOString(),
        skippedRefresh: true,
        message: 'Session silver rate override is active — external refresh skipped until lock expires.',
      });
    }

    const ratePerGram = await fetchAndCacheSilverRate();
    return successResponse({
      ratePerGram,
      currency: process.env.SILVER_RATE_CURRENCY || 'PKR',
      fetchedAt: new Date().toISOString(),
      fromCache: false,
      isSessionOverride: false,
      lockedUntil: null,
    });
  } catch (error) {
    console.error('Failed to refresh silver rate:', error);
    return errorResponse('Failed to refresh silver rate', 500);
  }
}
