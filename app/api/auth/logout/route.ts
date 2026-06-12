import { successResponse, errorResponse } from '@/lib/api-response';
import { destroySession } from '@/lib/auth';

export async function POST() {
  try {
    await destroySession();
    return successResponse({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout failed:', error);
    return errorResponse('Failed to logout', 500);
  }
}
