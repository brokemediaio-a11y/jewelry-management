"use client";

import Link from "next/link";
import { ArrowLeft, Download, FileBarChart, FileSpreadsheet, FileText } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ReportFilters,
  filtersToQuery,
  queryToFilters,
  type ReportFilterValues,
} from "@/components/reports/report-filters";
import { ReportKpiStrip } from "@/components/reports/report-kpi-strip";
import { ReportPreviewTable } from "@/components/reports/report-preview-table";
import { getReportDefinition } from "@/lib/report-registry";
import type { ReportResult } from "@/lib/report-types";

export function ReportViewer({ reportId }: { reportId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const def = getReportDefinition(reportId);

  const [filters, setFilters] = useState<ReportFilterValues>(() =>
    queryToFilters(searchParams)
  );
  const [report, setReport] = useState<ReportResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFilters(queryToFilters(searchParams));
  }, [searchParams]);

  const queryString = filtersToQuery(filters);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/reports/${reportId}?${queryString}`);
      const data = await res.json();
      if (data.success) setReport(data.data);
      else setError(data.error || "Failed to load report");
    } catch {
      setError("Failed to load report");
    } finally {
      setLoading(false);
    }
  }, [reportId, queryString]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const applyFilters = () => {
    router.push(`/dashboard/reports/${reportId}?${filtersToQuery(filters)}`);
  };

  const downloadCsv = () => {
    window.location.href = `/api/reports/${reportId}/export?${queryString}&format=csv`;
  };

  const downloadPdf = () => {
    window.location.href = `/api/reports/${reportId}/export?${queryString}&format=pdf`;
  };

  const downloadExcel = () => {
    window.location.href = `/api/reports/${reportId}/export?${queryString}&format=xlsx`;
  };

  if (!def) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Report not found.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/reports">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <FileBarChart className="h-6 w-6 text-muted-foreground" />
              <h1 className="text-3xl font-bold tracking-tight">
                {report?.title || def.title}
              </h1>
            </div>
            <p className="text-muted-foreground">{def.description}</p>
            {report && (
              <p className="mt-1 text-sm text-muted-foreground">
                Period: {report.periodLabel}
              </p>
            )}
            {filters.beopariId && (
              <p className="text-sm text-muted-foreground">Filtered by supplier</p>
            )}
            {filters.karegarId && (
              <p className="text-sm text-muted-foreground">Filtered by karegar</p>
            )}
            {filters.expenseType && (
              <p className="text-sm text-muted-foreground">
                Expense type: {filters.expenseType}
              </p>
            )}
            {filters.customerId && (
              <p className="text-sm text-muted-foreground">Filtered by customer</p>
            )}
            {filters.categoryId && (
              <p className="text-sm text-muted-foreground">Filtered by category</p>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={downloadCsv} disabled={loading || !report}>
            <Download className="mr-2 h-4 w-4" />
            CSV
          </Button>
          {def.supportsPdf && (
            <Button variant="outline" onClick={downloadPdf} disabled={loading || !report}>
              <FileText className="mr-2 h-4 w-4" />
              PDF
            </Button>
          )}
          {def.supportsExcel && (
            <Button onClick={downloadExcel} disabled={loading || !report}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Excel
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <ReportFilters
            values={filters}
            supportsDateRange={def.supportsDateRange}
            onChange={setFilters}
            onApply={applyFilters}
          />
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Generating report…</p>
      ) : report ? (
        <div className="space-y-6">
          <ReportKpiStrip kpis={report.kpis} />
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <ReportPreviewTable columns={report.columns} rows={report.rows} />
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
