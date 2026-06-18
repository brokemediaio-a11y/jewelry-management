/** Module color keys — each maps to CSS variables in globals.css */
export type ModuleKey =
  | "dashboard"
  | "new-sale"
  | "sales"
  | "karegar"
  | "expenses"
  | "inventory"
  | "categories"
  | "stones"
  | "beopari"
  | "customers"
  | "reports"
  | "settings";

export const MODULE_BY_HREF: Record<string, ModuleKey> = {
  "/dashboard": "dashboard",
  "/dashboard/sales/new": "new-sale",
  "/dashboard/sales": "sales",
  "/dashboard/karegar": "karegar",
  "/dashboard/expenses": "expenses",
  "/dashboard/inventory": "inventory",
  "/dashboard/categories": "categories",
  "/dashboard/stones": "stones",
  "/dashboard/beopari": "beopari",
  "/dashboard/customers": "customers",
  "/dashboard/reports": "reports",
  "/dashboard/settings": "settings",
};

export function getModuleKey(href: string): ModuleKey {
  if (MODULE_BY_HREF[href]) return MODULE_BY_HREF[href];
  const match = Object.keys(MODULE_BY_HREF)
    .filter((k) => k !== "/dashboard")
    .sort((a, b) => b.length - a.length)
    .find((k) => href.startsWith(k + "/"));
  return match ? MODULE_BY_HREF[match] : "dashboard";
}

export function moduleStyleVars(key: ModuleKey) {
  return {
    accent: `var(--module-${key})`,
    bg: `var(--module-${key}-bg)`,
    bgActive: `var(--module-${key}-bg-active)`,
  } as const;
}
