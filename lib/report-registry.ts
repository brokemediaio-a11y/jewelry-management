export type ReportCategory =
  | "financial"
  | "sales"
  | "inventory"
  | "expenses"
  | "beopari"
  | "karegar"
  | "customers";

export type ReportDefinition = {
  id: string;
  title: string;
  description: string;
  category: ReportCategory;
  supportsDateRange: boolean;
  supportsPdf?: boolean;
  supportsExcel?: boolean;
};

export const REPORT_DEFINITIONS: ReportDefinition[] = [
  {
    id: "profit-loss",
    title: "Profit & Loss",
    description: "Revenue, costs, expenses, and net profit for the selected period.",
    category: "financial",
    supportsDateRange: true,
    supportsPdf: true,
    supportsExcel: true,
  },
  {
    id: "cash-position",
    title: "Cash Position",
    description: "Current cash in hand and cash flows for the selected period.",
    category: "financial",
    supportsDateRange: true,
  },
  {
    id: "sales-register",
    title: "Sales Register",
    description: "All sales transactions with customer, type, status, and totals.",
    category: "sales",
    supportsDateRange: true,
    supportsPdf: true,
  },
  {
    id: "sales-margin",
    title: "Sales Margin",
    description: "Per-item margin on completed inventory sales: suggested vs final price and purchase cost.",
    category: "sales",
    supportsDateRange: true,
  },
  {
    id: "custom-orders",
    title: "Custom Orders",
    description: "Custom orders with advance, remaining, pickup date, and workshop status.",
    category: "sales",
    supportsDateRange: true,
  },
  {
    id: "expense-breakdown",
    title: "Expense Breakdown",
    description: "Expenses by type with payment method and descriptions.",
    category: "expenses",
    supportsDateRange: true,
  },
  {
    id: "stock-on-hand",
    title: "Stock on Hand",
    description: "Current inventory items with category, weight, and purchase cost.",
    category: "inventory",
    supportsDateRange: false,
  },
  {
    id: "inventory-valuation",
    title: "Inventory Valuation",
    description: "Stock value by category: purchase cost and estimated value at today's silver rate.",
    category: "inventory",
    supportsDateRange: false,
  },
  {
    id: "aging-stock",
    title: "Aging Stock",
    description: "Available items sorted by age — identify slow-moving inventory.",
    category: "inventory",
    supportsDateRange: false,
  },
  {
    id: "beopari-summary",
    title: "Beopari Summary",
    description: "All suppliers with total purchases, paid, and remaining balances.",
    category: "beopari",
    supportsDateRange: false,
  },
  {
    id: "supplier-statement",
    title: "Supplier Statement",
    description: "Single beopari ledger: purchases and payments for the period.",
    category: "beopari",
    supportsDateRange: true,
  },
  {
    id: "karegar-payments",
    title: "Karegar Payments",
    description: "Workshop labor payments by worker and linked orders.",
    category: "karegar",
    supportsDateRange: true,
  },
  {
    id: "workshop-queue",
    title: "Workshop Queue",
    description: "Workshop orders with status, karegar, and linked sale details.",
    category: "karegar",
    supportsDateRange: true,
  },
  {
    id: "customer-summary",
    title: "Customer Summary",
    description: "All customers with purchase count, total spent, and last purchase in the period.",
    category: "customers",
    supportsDateRange: true,
  },
  {
    id: "top-customers",
    title: "Top Customers",
    description: "Customers ranked by revenue in the selected period.",
    category: "customers",
    supportsDateRange: true,
  },
  {
    id: "customer-statement",
    title: "Customer Statement",
    description: "Single customer purchase history for the period.",
    category: "customers",
    supportsDateRange: true,
  },
];

export function getReportDefinition(id: string): ReportDefinition | undefined {
  return REPORT_DEFINITIONS.find((r) => r.id === id);
}

export const REPORT_CATEGORY_LABELS: Record<ReportCategory, string> = {
  financial: "Financial",
  sales: "Sales",
  inventory: "Inventory",
  expenses: "Expenses",
  beopari: "Beopari",
  karegar: "Karegar",
  customers: "Customers",
};
