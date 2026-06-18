import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import { parseReportContext } from "@/lib/report-context";
import { parseReportPeriod } from "@/lib/report-date-utils";
import { getReportDefinition } from "@/lib/report-registry";
import { generateReport } from "@/lib/report-queries";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reportId: string }> }
) {
  const auth = await requireAuth();
  if ("error" in auth) return errorResponse(auth.error, auth.status);

  try {
    const { reportId } = await params;
    const def = getReportDefinition(reportId);
    if (!def) return errorResponse("Report not found", 404);

    const period = parseReportPeriod(request.nextUrl.searchParams);
    const context = parseReportContext(request.nextUrl.searchParams);
    const report = await generateReport(reportId, period, context);

    return successResponse(report);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate report";
    console.error("Failed to generate report:", error);
    return errorResponse(message, message.includes("required") ? 400 : 500);
  }
}
