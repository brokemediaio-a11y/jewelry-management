import type { UserRole } from "@prisma/client";

export function getPostLoginPath(role: UserRole | string, callbackUrl?: string | null): string {
  if (callbackUrl && callbackUrl.startsWith("/dashboard") && callbackUrl !== "/dashboard") {
    return callbackUrl;
  }

  switch (role) {
    case "CLERK":
      return "/dashboard/sales/new";
    case "ACCOUNTANT":
      return "/dashboard/reports";
    case "ADMIN":
    case "STAFF":
    default:
      return "/dashboard";
  }
}

export function canViewCashPill(role: UserRole): boolean {
  return role === "ADMIN" || role === "ACCOUNTANT";
}
