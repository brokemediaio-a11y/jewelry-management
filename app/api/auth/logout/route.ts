import { successResponse, errorResponse } from '@/lib/api-response';
import { destroySession } from '@/lib/auth';
import { clearSessionSilverRateOverride } from '@/lib/silver-rate-session';

export async function POST() {
  try {
    await clearSessionSilverRateOverride();
    await destroySession();
    return successResponse({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout failed:', error);
    return errorResponse('Failed to logout', 500);
  }
}
