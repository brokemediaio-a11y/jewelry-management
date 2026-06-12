import { successResponse, errorResponse } from '@/lib/api-response';
import { requireAdmin } from '@/lib/auth';
import { fetchAndCacheSilverRate } from '@/lib/silver-rate-service';

export async function POST() {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) {
      return errorResponse(auth.error, auth.status);
    }

    const ratePerGram = await fetchAndCacheSilverRate();
    return successResponse({
      ratePerGram,
      currency: process.env.SILVER_RATE_CURRENCY || 'PKR',
      fetchedAt: new Date(),
      fromCache: false,
    });
  } catch (error) {
    console.error('Failed to refresh silver rate:', error);
    return errorResponse('Failed to refresh silver rate', 500);
  }
}
