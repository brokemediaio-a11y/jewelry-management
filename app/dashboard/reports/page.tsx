"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { FileBarChart, Search, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  REPORT_CATEGORY_LABELS,
  REPORT_DEFINITIONS,
  getReportDefinition,
  type ReportCategory,
} from "@/lib/report-registry";
import {
  getReportFavorites,
  toggleReportFavorite,
} from "@/lib/report-favorites";
import { useRecentReports } from "@/components/reports/use-recent-reports";

const QUICK_LINKS = [
  { reportId: "profit-loss", label: "This month P&L", period: "this-month" },
  { reportId: "cash-position", label: "Cash position", period: "this-month" },
  { reportId: "sales-register", label: "Sales register", period: "this-month" },
  { reportId: "custom-orders", label: "Custom orders", period: "this-month" },
  { reportId: "beopari-summary", label: "Beopari summary", period: "this-month" },
  { reportId: "workshop-queue", label: "Workshop queue", period: "this-month" },
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

function ReportCard({
  reportId,
  isFavorite,
  onToggleFavorite,
}: {
  reportId: string;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
}) {
  const report = getReportDefinition(reportId);
  if (!report) return null;

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <FileBarChart className="h-5 w-5 shrink-0 text-muted-foreground" />
          <div className="flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
              onClick={() => onToggleFavorite(reportId)}
            >
              <Star
                className={isFavorite ? "h-4 w-4 fill-brand-bronze text-brand-bronze" : "h-4 w-4"}
              />
            </Button>
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
  );
}

export default function ReportsHubPage() {
  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState<string[]>(() => getReportFavorites());
  const recentIds = useRecentReports();

  const handleToggleFavorite = (reportId: string) => {
    setFavorites(toggleReportFavorite(reportId));
  };

  const filteredReports = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return REPORT_DEFINITIONS;
    return REPORT_DEFINITIONS.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        REPORT_CATEGORY_LABELS[r.category].toLowerCase().includes(q)
    );
  }, [search]);

  const favoriteReports = favorites
    .map((id) => getReportDefinition(id))
    .filter(Boolean);
  const recentReports = recentIds
    .map((id) => getReportDefinition(id))
    .filter(Boolean);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">
          Financial, sales, inventory, customer, beopari, and karegar reports
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search reports…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {favoriteReports.length > 0 && !search && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Favorites</CardTitle>
            <CardDescription>Reports you starred for quick access</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {favorites.map((id) => (
              <ReportCard
                key={id}
                reportId={id}
                isFavorite
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {recentReports.length > 0 && !search && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recently viewed</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {recentReports.map((r) =>
              r ? (
                <Button key={r.id} variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/reports/${r.id}?period=this-month`}>
                    {r.title}
                  </Link>
                </Button>
              ) : null
            )}
          </CardContent>
        </Card>
      )}

      {!search && (
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
      )}

      {search ? (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">
            Search results ({filteredReports.length})
          </h2>
          {filteredReports.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredReports.map((report) => (
                <ReportCard
                  key={report.id}
                  reportId={report.id}
                  isFavorite={favorites.includes(report.id)}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No reports match your search.</p>
          )}
        </div>
      ) : (
        CATEGORIES.map((category) => {
          const reports = REPORT_DEFINITIONS.filter((r) => r.category === category);
          if (!reports.length) return null;

          return (
            <div key={category} className="space-y-3">
              <h2 className="text-lg font-semibold">{REPORT_CATEGORY_LABELS[category]}</h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {reports.map((report) => (
                  <ReportCard
                    key={report.id}
                    reportId={report.id}
                    isFavorite={favorites.includes(report.id)}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
