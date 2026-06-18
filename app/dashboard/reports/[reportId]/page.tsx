"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { ReportViewer } from "@/components/reports/report-viewer";

function ReportPageInner() {
  const params = useParams();
  const reportId = params.reportId as string;
  return <ReportViewer reportId={reportId} />;
}

export default function ReportDetailPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading report…</p>}>
      <ReportPageInner />
    </Suspense>
  );
}
