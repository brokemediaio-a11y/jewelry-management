"use client";

import Link from "next/link";
import { FileBarChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  REPORT_CATEGORY_LABELS,
  REPORT_DEFINITIONS,
  type ReportCategory,
} from "@/lib/report-registry";

const QUICK_LINKS = [
  { reportId: "profit-loss", label: "This month P&L", period: "this-month" },
  { reportId: "cash-position", label: "Cash position", period: "this-month" },
  { reportId: "sales-register", label: "Sales register", period: "this-month" },
  { reportId: "sales-margin", label: "Sales margin", period: "this-month" },
  { reportId: "custom-orders", label: "Custom orders", period: "this-month" },
  { reportId: "top-customers", label: "Top customers", period: "this-month" },
  { reportId: "beopari-summary", label: "Beopari summary", period: "this-month" },
  { reportId: "workshop-queue", label: "Workshop queue", period: "this-month" },
  { reportId: "inventory-valuation", label: "Inventory valuation", period: "this-month" },
  { reportId: "aging-stock", label: "Aging stock", period: "this-month" },
  { reportId: "stock-on-hand", label: "Stock on hand", period: "this-month" },
];

const CATEGORIES: ReportCategory[] = [
  "financial",
  "sales",
  "expenses",
  "inventory",
  "customers",
  "beopari",
  "karegar",
];

export default function ReportsHubPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">
          Financial, sales, inventory, customer, beopari, and karegar reports — CSV, PDF, and Excel
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick exports</CardTitle>
          <CardDescription>Common reports with default filters</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {QUICK_LINKS.map((q) => (
            <Button key={q.reportId} variant="outline" size="sm" asChild>
              <Link href={`/dashboard/reports/${q.reportId}?period=${q.period}`}>
                {q.label}
              </Link>
            </Button>
          ))}
        </CardContent>
      </Card>

      {CATEGORIES.map((category) => {
        const reports = REPORT_DEFINITIONS.filter((r) => r.category === category);
        if (!reports.length) return null;

        return (
          <div key={category} className="space-y-3">
            <h2 className="text-lg font-semibold">{REPORT_CATEGORY_LABELS[category]}</h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {reports.map((report) => (
                <Card key={report.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <FileBarChart className="h-5 w-5 shrink-0 text-muted-foreground" />
                      <div className="flex gap-1">
                        <Badge variant="secondary" className="text-xs">
                          CSV
                        </Badge>
                        {report.supportsPdf && (
                          <Badge variant="outline" className="text-xs">
                            PDF
                          </Badge>
                        )}
                        {report.supportsExcel && (
                          <Badge variant="outline" className="text-xs">
                            Excel
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardTitle className="text-base">{report.title}</CardTitle>
                    <CardDescription>{report.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto">
                    <Button asChild className="w-full">
                      <Link href={`/dashboard/reports/${report.id}?period=this-month`}>
                        Open report
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
