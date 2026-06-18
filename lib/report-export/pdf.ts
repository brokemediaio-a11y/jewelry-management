import { jsPDF } from "jspdf";
import { formatPKR } from "@/lib/currency-utils";
import type { ReportColumn, ReportKpi, ReportResult } from "@/lib/report-types";

function formatKpiValue(kpi: ReportKpi): string {
  if (kpi.format === "currency") return formatPKR(kpi.value);
  if (kpi.format === "number") return kpi.value.toLocaleString();
  return String(kpi.value);
}

function formatCellValue(key: string, value: string | number | null): string {
  if (value == null) return "—";
  if (
    typeof value === "number" &&
    (key.includes("amount") ||
      key.includes("total") ||
      key.includes("cost") ||
      key.includes("revenue") ||
      key.includes("value") ||
      key.includes("advance") ||
      key.includes("remaining") ||
      key === "paid" ||
      key === "silverRate" ||
      key === "costPerGram")
  ) {
    return formatPKR(value);
  }
  const str = String(value);
  return str.length > 48 ? `${str.slice(0, 45)}...` : str;
}

export function reportToPdfBuffer(report: ReportResult, shopName = "Venus Silver Collection"): ArrayBuffer {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  let y = margin;

  doc.setFontSize(16);
  doc.text(shopName, margin, y);
  y += 8;
  doc.setFontSize(13);
  doc.text(report.title, margin, y);
  y += 6;
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`Period: ${report.periodLabel}`, margin, y);
  doc.text(`Generated: ${new Date(report.generatedAt).toLocaleString()}`, pageWidth / 2, y);
  y += 8;
  doc.setTextColor(0);

  if (report.kpis.length) {
    doc.setFontSize(10);
    const kpiText = report.kpis.map((k) => `${k.label}: ${formatKpiValue(k)}`).join("   |   ");
    const lines = doc.splitTextToSize(kpiText, pageWidth - margin * 2);
    doc.text(lines, margin, y);
    y += lines.length * 5 + 4;
  }

  const colCount = report.columns.length;
  const tableWidth = pageWidth - margin * 2;
  const colWidth = tableWidth / colCount;
  const rowHeight = 7;

  doc.setFillColor(240, 240, 240);
  doc.rect(margin, y, tableWidth, rowHeight, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  report.columns.forEach((col, i) => {
    const x = margin + i * colWidth + 1;
    doc.text(col.label, x, y + 5, { maxWidth: colWidth - 2 });
  });
  y += rowHeight;
  doc.setFont("helvetica", "normal");

  for (const row of report.rows) {
    if (y > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }
    report.columns.forEach((col, i) => {
      const x = margin + i * colWidth + 1;
      const text = formatCellValue(col.key, row[col.key] ?? null);
      doc.text(text, x, y + 5, { maxWidth: colWidth - 2 });
    });
    y += rowHeight;
  }

  return doc.output("arraybuffer");
}

export function pdfFilename(reportId: string, periodLabel: string): string {
  const safe = periodLabel.replace(/[^\w\-]+/g, "_").slice(0, 40);
  return `${reportId}_${safe}_${new Date().toISOString().slice(0, 10)}.pdf`;
}
