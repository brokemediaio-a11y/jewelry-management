export type ReportKpi = {
  key: string;
  label: string;
  value: number;
  format: "currency" | "number" | "text";
};

export type ReportColumn = {
  key: string;
  label: string;
  align?: "left" | "right";
};

export type ReportRow = Record<string, string | number | null>;

export type ReportResult = {
  reportId: string;
  title: string;
  periodLabel: string;
  periodFrom: string;
  periodTo: string;
  kpis: ReportKpi[];
  columns: ReportColumn[];
  rows: ReportRow[];
  generatedAt: string;
};
