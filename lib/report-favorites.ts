const FAVORITES_KEY = "venus-report-favorites";
const RECENT_KEY = "venus-report-recent";
const MAX_RECENT = 8;

export function getReportFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function toggleReportFavorite(reportId: string): string[] {
  const current = getReportFavorites();
  const next = current.includes(reportId)
    ? current.filter((id) => id !== reportId)
    : [...current, reportId];
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  return next;
}

export function getRecentReports(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function recordRecentReport(reportId: string): string[] {
  const current = getRecentReports().filter((id) => id !== reportId);
  const next = [reportId, ...current].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  return next;
}
