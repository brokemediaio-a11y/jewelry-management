"use client";

import { useEffect, useState } from "react";
import { getRecentReports, recordRecentReport } from "@/lib/report-favorites";

export function useRecentReports() {
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    setRecent(getRecentReports());
  }, []);

  return recent;
}

export function useTrackRecentReport(reportId: string) {
  useEffect(() => {
    recordRecentReport(reportId);
  }, [reportId]);
}
