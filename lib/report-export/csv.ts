import type { ReportColumn, ReportResult } from "@/lib/report-types";

function escapeCsvCell(value: string | number | null | undefined): string {
  const str = value == null ? "" : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function reportToCsv(report: ReportResult): string {
  const lines: string[] = [
    report.title,
    `Period: ${report.periodLabel}`,
    `Generated: ${new Date(report.generatedAt).toLocaleString()}`,
    "",
  ];

  if (report.kpis.length) {
    lines.push("Summary");
    for (const kpi of report.kpis) {
      lines.push(`${kpi.label},${kpi.value}`);
    }
    lines.push("");
  }

  lines.push(report.columns.map((c) => escapeCsvCell(c.label)).join(","));
  for (const row of report.rows) {
    lines.push(
      report.columns.map((c) => escapeCsvCell(row[c.key] ?? "")).join(",")
    );
  }

  return lines.join("\r\n");
}

export function csvFilename(reportId: string, periodLabel: string): string {
  const safe = periodLabel.replace(/[^\w\-]+/g, "_").slice(0, 40);
  return `${reportId}_${safe}_${new Date().toISOString().slice(0, 10)}.csv`;
}
