import { successResponse, errorResponse } from '@/lib/api-response';
import { getCurrentSilverRate } from '@/lib/silver-rate-service';

export async function GET() {
  try {
    const rate = await getCurrentSilverRate();
    return successResponse({
      ...rate,
      fetchedAt: rate.fetchedAt.toISOString(),
    });
  } catch (error) {
    console.error('Failed to get silver rate:', error);
    return errorResponse('Failed to fetch silver rate', 500);
  }
}
