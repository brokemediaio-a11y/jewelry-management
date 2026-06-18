export type ReportContext = {
  beopariId?: string;
  karegarId?: string;
  expenseType?: string;
  customerId?: string;
  categoryId?: string;
};

export function parseReportContext(searchParams: URLSearchParams): ReportContext {
  return {
    beopariId: searchParams.get("beopariId") || undefined,
    karegarId: searchParams.get("karegarId") || undefined,
    expenseType: searchParams.get("expenseType") || undefined,
    customerId: searchParams.get("customerId") || undefined,
    categoryId: searchParams.get("categoryId") || undefined,
  };
}

export function appendContextToSearchParams(
  params: URLSearchParams,
  context: ReportContext
): void {
  if (context.beopariId) params.set("beopariId", context.beopariId);
  if (context.karegarId) params.set("karegarId", context.karegarId);
  if (context.expenseType) params.set("expenseType", context.expenseType);
  if (context.customerId) params.set("customerId", context.customerId);
  if (context.categoryId) params.set("categoryId", context.categoryId);
}

export function contextFromSearchParams(searchParams: URLSearchParams): ReportContext {
  return parseReportContext(searchParams);
}
