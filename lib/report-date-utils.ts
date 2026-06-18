export type ReportPeriod = {
  from: Date;
  to: Date;
  label: string;
};

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export function getMonthStart(d = new Date()): Date {
  return startOfDay(new Date(d.getFullYear(), d.getMonth(), 1));
}

export function getMonthEnd(d = new Date()): Date {
  return endOfDay(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}

export function parseReportPeriod(searchParams: URLSearchParams): ReportPeriod {
  const preset = searchParams.get("period") || "this-month";
  const customFrom = searchParams.get("from");
  const customTo = searchParams.get("to");

  const now = new Date();

  if (preset === "custom" && customFrom && customTo) {
    return {
      from: startOfDay(new Date(customFrom)),
      to: endOfDay(new Date(customTo)),
      label: `${customFrom} – ${customTo}`,
    };
  }

  if (preset === "last-month") {
    const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return {
      from: getMonthStart(d),
      to: getMonthEnd(d),
      label: d.toLocaleString("en-US", { month: "long", year: "numeric" }),
    };
  }

  if (preset === "this-quarter") {
    const q = Math.floor(now.getMonth() / 3);
    const from = startOfDay(new Date(now.getFullYear(), q * 3, 1));
    const to = endOfDay(new Date(now.getFullYear(), q * 3 + 3, 0));
    return {
      from,
      to,
      label: `Q${q + 1} ${now.getFullYear()}`,
    };
  }

  return {
    from: getMonthStart(now),
    to: endOfDay(now),
    label: now.toLocaleString("en-US", { month: "long", year: "numeric" }),
  };
}

export function saleDateFilter(period: ReportPeriod) {
  return { gte: period.from, lte: period.to };
}

export function expenseDateFilter(period: ReportPeriod) {
  return { gte: period.from, lte: period.to };
}
