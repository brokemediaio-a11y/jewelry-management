import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { errorResponse } from "@/lib/api-response";
import { parseReportContext } from "@/lib/report-context";
import { parseReportPeriod } from "@/lib/report-date-utils";
import { csvFilename, reportToCsv } from "@/lib/report-export/csv";
import { pdfFilename, reportToPdfBuffer } from "@/lib/report-export/pdf";
import { profitLossToXlsxBuffer, xlsxFilename } from "@/lib/report-export/xlsx";
import { getReportDefinition } from "@/lib/report-registry";
import { generateReport } from "@/lib/report-queries";
import { getSetting } from "@/lib/settings-utils";

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

    const format = request.nextUrl.searchParams.get("format") || "csv";
    const period = parseReportPeriod(request.nextUrl.searchParams);
    const context = parseReportContext(request.nextUrl.searchParams);
    const shopName = (await getSetting("shop_name")) || "Venus Silver Collection";

    if (format === "xlsx") {
      if (!def.supportsExcel) {
        return errorResponse("Excel export is not available for this report", 400);
      }

      if (reportId === "profit-loss") {
        const [summary, sales, expenses] = await Promise.all([
          generateReport("profit-loss", period, context),
          generateReport("sales-register", period, context),
          generateReport("expense-breakdown", period, context),
        ]);
        const buffer = await profitLossToXlsxBuffer(summary, sales, expenses, shopName);
        const filename = xlsxFilename(reportId, period.label);

        return new NextResponse(buffer, {
          status: 200,
          headers: {
            "Content-Type":
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename="${filename}"`,
          },
        });
      }

      return errorResponse("Excel export is not available for this report", 400);
    }

    const report = await generateReport(reportId, period, context);

    if (format === "pdf") {
      if (!def.supportsPdf) {
        return errorResponse("PDF export is not available for this report", 400);
      }
      const buffer = reportToPdfBuffer(report, shopName);
      const filename = pdfFilename(reportId, period.label);

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    const csv = reportToCsv(report);
    const filename = csvFilename(reportId, period.label);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to export report";
    console.error("Failed to export report:", error);
    return errorResponse(message, message.includes("required") ? 400 : 500);
  }
}
