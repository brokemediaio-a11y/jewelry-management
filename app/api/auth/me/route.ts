import { successResponse, errorResponse } from '@/lib/api-response';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return errorResponse('Unauthorized', 401);
    }

    return successResponse(session);
  } catch (error) {
    console.error('Failed to get session:', error);
    return errorResponse('Failed to get session', 500);
  }
}
