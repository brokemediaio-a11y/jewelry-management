import { formatStoneSnapshot } from "@/lib/stone-utils";

type SaleForSummary = {
  source?: "INVENTORY" | "EXTERNAL";
  orderDescription?: string | null;
  items?: Array<{
    categoryName?: string | null;
    inventoryItem?: { category?: { name?: string | null } | null } | null;
    stoneTypeName?: string | null;
    stoneColorName?: string | null;
    stoneCutName?: string | null;
    stoneClarityName?: string | null;
    stonePrice?: number | null;
  }>;
};

export function formatSaleItemsSummary(sale: SaleForSummary): string {
  if (sale.source === "EXTERNAL") {
    const text = (sale.orderDescription || "Custom (sample order)").trim();
    return text.length > 60 ? `${text.slice(0, 57)}...` : text;
  }

  const items = sale.items ?? [];
  if (!items.length) return "—";

  return items
    .map((item) => {
      const category =
        item.categoryName ||
        item.inventoryItem?.category?.name ||
        "Item";

      const stone = formatStoneSnapshot(item) || "No stone";
      return `${category} (${stone})`;
    })
    .join(", ");
}

