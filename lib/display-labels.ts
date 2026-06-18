/** Human-readable labels for enums shown in the UI. */

export function formatSaleStatus(status: string): string {
  const map: Record<string, string> = {
    COMPLETED: "Completed",
    OPEN: "Open",
    CANCELLED: "Cancelled",
  };
  return map[status] ?? status.replace(/_/g, " ");
}

export function formatSaleType(saleType: string): string {
  const map: Record<string, string> = {
    PURCHASE: "From Stock",
    CUSTOM_ORDER: "Custom Order",
  };
  return map[saleType] ?? saleType.replace(/_/g, " ");
}

export function formatSaleSource(source: string): string {
  const map: Record<string, string> = {
    INVENTORY: "From Stock",
    EXTERNAL: "Sample Order",
  };
  return map[source] ?? source.replace(/_/g, " ");
}

export function formatInventoryStatus(status: string): string {
  const map: Record<string, string> = {
    AVAILABLE: "Available",
    SOLD: "Sold",
    RESERVED: "Reserved",
  };
  return map[status] ?? status.replace(/_/g, " ");
}

export function formatExpenseType(expenseType: string): string {
  const map: Record<string, string> = {
    BEOPARI: "Beopari",
    KAREGAR: "Karegar",
    SHOP: "Shop",
    HOME: "Home",
  };
  return map[expenseType] ?? expenseType.replace(/_/g, " ");
}

export function formatWorkshopStatus(status: string): string {
  const map: Record<string, string> = {
    SENT_TO_WORKSHOP: "Sent to Workshop",
    IN_PROGRESS: "In Progress",
    COMPLETE: "Complete",
  };
  return map[status] ?? status.replace(/_/g, " ");
}

export function formatPaymentMethod(method: string): string {
  const map: Record<string, string> = {
    CASH: "Cash",
    CARD: "Card",
    UPI: "UPI",
    BANK_TRANSFER: "Bank Transfer",
    CHEQUE: "Cheque",
  };
  return map[method] ?? method.replace(/_/g, " ");
}

export function formatItemQuality(quality: string): string {
  const map: Record<string, string> = {
    PREMIUM: "Premium",
    LOCAL: "Local",
  };
  return map[quality] ?? quality;
}

export type StatusBadgeVariant =
  | "success"
  | "warning"
  | "muted"
  | "default"
  | "info";

export function saleStatusVariant(status: string): StatusBadgeVariant {
  if (status === "COMPLETED") return "success";
  if (status === "OPEN") return "warning";
  if (status === "CANCELLED") return "muted";
  return "default";
}

export function inventoryStatusVariant(status: string): StatusBadgeVariant {
  if (status === "AVAILABLE") return "success";
  if (status === "RESERVED") return "warning";
  if (status === "SOLD") return "muted";
  return "default";
}

export function workshopStatusVariant(status: string): StatusBadgeVariant {
  if (status === "COMPLETE") return "success";
  if (status === "IN_PROGRESS") return "info";
  if (status === "SENT_TO_WORKSHOP") return "warning";
  return "default";
}

export function expenseTypeVariant(expenseType: string): StatusBadgeVariant {
  if (expenseType === "BEOPARI") return "info";
  if (expenseType === "KAREGAR") return "warning";
  if (expenseType === "SHOP") return "default";
  if (expenseType === "HOME") return "muted";
  return "default";
}
