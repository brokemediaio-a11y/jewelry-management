import type { UserRole } from "@prisma/client";

/** Counter staff: sales + inventory only */
export function isWorkerRole(role: UserRole | string): boolean {
  return role === "WORKER" || role === "CLERK";
}

export function hasFullDashboardAccess(role: UserRole | string): boolean {
  return role === "ADMIN" || role === "STAFF";
}

const WORKER_PAGE_PREFIXES = ["/dashboard/sales", "/dashboard/inventory"];

type ApiRule = {
  prefix: string;
  methods: string[];
  /** If true, only exact prefix match (no subpaths) */
  exact?: boolean;
};

const WORKER_API_RULES: ApiRule[] = [
  { prefix: "/api/auth", methods: ["GET", "POST"] },
  { prefix: "/api/sales", methods: ["GET", "POST", "PUT", "PATCH", "DELETE"] },
  { prefix: "/api/inventory", methods: ["GET", "POST", "PUT", "PATCH"] },
  { prefix: "/api/customers", methods: ["GET", "POST"], exact: true },
  { prefix: "/api/categories", methods: ["GET"] },
  { prefix: "/api/stones", methods: ["GET"] },
  { prefix: "/api/settings/pricing", methods: ["GET"] },
  { prefix: "/api/silver-rates/current", methods: ["GET"] },
  { prefix: "/api/silver-rates/session", methods: ["GET", "POST", "DELETE"] },
];

export function isPageAllowedForRole(pathname: string, role: UserRole | string): boolean {
  if (hasFullDashboardAccess(role)) return true;
  if (role === "ACCOUNTANT") {
    return pathname === "/dashboard/reports" || pathname.startsWith("/dashboard/reports/");
  }
  if (!isWorkerRole(role)) return false;

  if (pathname === "/dashboard") return false;

  return WORKER_PAGE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export function getDefaultDashboardPath(role: UserRole | string): string {
  if (isWorkerRole(role)) return "/dashboard/sales/new";
  if (role === "ACCOUNTANT") return "/dashboard/reports";
  return "/dashboard";
}

export function isApiAllowedForRole(
  pathname: string,
  method: string,
  role: UserRole | string
): boolean {
  if (hasFullDashboardAccess(role)) return true;

  if (role === "ACCOUNTANT") {
    return (
      pathname.startsWith("/api/auth") ||
      pathname.startsWith("/api/reports") ||
      pathname === "/api/cash-position"
    );
  }

  if (!isWorkerRole(role)) return false;

  const upperMethod = method.toUpperCase();

  return WORKER_API_RULES.some((rule) => {
    const pathMatch = rule.exact
      ? pathname === rule.prefix
      : pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`);
    return pathMatch && rule.methods.includes(upperMethod);
  });
}
