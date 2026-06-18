import type { UserRole } from "@prisma/client";
import { getDefaultDashboardPath, isPageAllowedForRole } from "@/lib/role-access";

export function getPostLoginPath(role: UserRole | string, callbackUrl?: string | null): string {
  if (
    callbackUrl &&
    callbackUrl.startsWith("/dashboard") &&
    isPageAllowedForRole(callbackUrl, role)
  ) {
    return callbackUrl;
  }

  return getDefaultDashboardPath(role);
}

export function canViewCashPill(role: UserRole): boolean {
  return role === "ADMIN" || role === "ACCOUNTANT";
}
