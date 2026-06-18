import ExcelJS from "exceljs";
import type { ReportColumn, ReportResult } from "@/lib/report-types";

function addReportSheet(
  workbook: ExcelJS.Workbook,
  sheetName: string,
  report: ReportResult,
  shopName: string
): void {
  const sheet = workbook.addWorksheet(sheetName.slice(0, 31));

  sheet.addRow([shopName]);
  sheet.addRow([report.title]);
  sheet.addRow([`Period: ${report.periodLabel}`]);
  sheet.addRow([`Generated: ${new Date(report.generatedAt).toLocaleString()}`]);
  sheet.addRow([]);

  if (report.kpis.length) {
    sheet.addRow(["Summary"]);
    for (const kpi of report.kpis) {
      sheet.addRow([kpi.label, kpi.value]);
    }
    sheet.addRow([]);
  }

  const headerRow = sheet.addRow(report.columns.map((c) => c.label));
  headerRow.font = { bold: true };

  for (const row of report.rows) {
    sheet.addRow(report.columns.map((c) => row[c.key] ?? ""));
  }

  report.columns.forEach((col: ReportColumn, idx: number) => {
    const column = sheet.getColumn(idx + 1);
    if (col.align === "right") {
      column.alignment = { horizontal: "right" };
    }
    column.width = Math.max(col.label.length + 2, 14);
  });
}

export async function profitLossToXlsxBuffer(
  summary: ReportResult,
  sales: ReportResult,
  expenses: ReportResult,
  shopName: string
): Promise<ArrayBuffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = shopName;
  workbook.created = new Date();

  addReportSheet(workbook, "P&L Summary", summary, shopName);
  addReportSheet(workbook, "Sales", sales, shopName);
  addReportSheet(workbook, "Expenses", expenses, shopName);

  return workbook.xlsx.writeBuffer() as Promise<ArrayBuffer>;
}

export function xlsxFilename(reportId: string, periodLabel: string): string {
  const safe = periodLabel.replace(/[^\w\-]+/g, "_").slice(0, 40);
  return `${reportId}_${safe}_${new Date().toISOString().slice(0, 10)}.xlsx`;
}
