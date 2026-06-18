import { requireAuth } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import { calculateCashInHand } from "@/lib/cash-utils";

export async function GET() {
  const auth = await requireAuth();
  if ("error" in auth) return errorResponse(auth.error, auth.status);

  if (auth.session.role !== "ADMIN" && auth.session.role !== "ACCOUNTANT") {
    return errorResponse("Forbidden", 403);
  }

  try {
    const cashInHand = await calculateCashInHand();
    return successResponse({ cashInHand });
  } catch (err) {
    console.error("Failed to fetch cash position:", err);
    return errorResponse("Failed to fetch cash position", 500);
  }
}
