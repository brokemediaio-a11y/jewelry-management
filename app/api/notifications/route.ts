import { requireAuth } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import { getAppNotifications } from "@/lib/notification-utils";

export async function GET() {
  const auth = await requireAuth();
  if ("error" in auth) return errorResponse(auth.error, auth.status);

  try {
    const notifications = await getAppNotifications();
    return successResponse({ notifications, count: notifications.length });
  } catch (err) {
    console.error("Failed to fetch notifications:", err);
    return errorResponse("Failed to fetch notifications", 500);
  }
}
