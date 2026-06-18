"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPKR } from "@/lib/currency-utils";
import type { ReportKpi } from "@/lib/report-types";

export function ReportKpiStrip({ kpis }: { kpis: ReportKpi[] }) {
  if (!kpis.length) return null;

  const formatValue = (kpi: ReportKpi) => {
    if (kpi.format === "currency") return formatPKR(kpi.value);
    if (kpi.format === "number") return kpi.value.toLocaleString();
    return String(kpi.value);
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => (
        <Card key={kpi.key}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {kpi.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatValue(kpi)}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
