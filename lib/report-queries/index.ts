import { prisma } from "@/lib/prisma";
import { calculateCashInHand } from "@/lib/cash-utils";
import { formatSaleItemsSummary } from "@/lib/sale-summary-utils";
import { priceItem } from "@/lib/pricing-engine";
import { getPricingConfig } from "@/lib/settings-utils";
import { getCurrentSilverRate } from "@/lib/silver-rate-service";
import type { ReportPeriod } from "@/lib/report-date-utils";
import { expenseDateFilter, saleDateFilter } from "@/lib/report-date-utils";
import type { ReportContext } from "@/lib/report-context";
import { aggregateBeopariLedger } from "@/lib/beopari-utils";
import { getReportDefinition } from "@/lib/report-registry";
import type { ReportResult } from "@/lib/report-types";

function baseMeta(reportId: string, period: ReportPeriod): Pick<
  ReportResult,
  "reportId" | "title" | "periodLabel" | "periodFrom" | "periodTo" | "generatedAt"
> {
  const def = getReportDefinition(reportId);
  return {
    reportId,
    title: def?.title || reportId,
    periodLabel: period.label,
    periodFrom: period.from.toISOString(),
    periodTo: period.to.toISOString(),
    generatedAt: new Date().toISOString(),
  };
}

async function profitLossReport(period: ReportPeriod): Promise<ReportResult> {
  const saleWhere = {
    createdAt: saleDateFilter(period),
    status: "COMPLETED" as const,
  };

  const [
    revenueAgg,
    itemAgg,
    externalCostAgg,
    expensesAgg,
    expensesByType,
  ] = await Promise.all([
    prisma.sale.aggregate({ where: saleWhere, _sum: { finalPrice: true } }),
    prisma.saleItem.aggregate({
      where: { sale: saleWhere },
      _sum: { finalPrice: true, purchasePricePerPiece: true },
    }),
    prisma.sale.aggregate({
      where: { ...saleWhere, source: "EXTERNAL" },
      _sum: { manualCost: true },
    }),
    prisma.expense.aggregate({
      where: { expenseDate: expenseDateFilter(period) },
      _sum: { amount: true },
    }),
    prisma.expense.groupBy({
      by: ["expenseType"],
      where: { expenseDate: expenseDateFilter(period) },
      _sum: { amount: true },
    }),
  ]);

  const revenue = Number(revenueAgg._sum.finalPrice || 0);
  const itemRevenue = Number(itemAgg._sum.finalPrice || 0);
  const purchaseCost = Number(itemAgg._sum.purchasePricePerPiece || 0);
  const externalCost = Number(externalCostAgg._sum.manualCost || 0);
  const totalExpenses = Number(expensesAgg._sum.amount || 0);
  const grossMargin = itemRevenue - purchaseCost - externalCost;
  const netProfit = grossMargin - totalExpenses;

  const rows = [
    { line: "Completed sale revenue", amount: revenue },
    { line: "Inventory item revenue (line items)", amount: itemRevenue },
    { line: "Purchase cost (per piece)", amount: -purchaseCost },
    { line: "External order manual cost", amount: -externalCost },
    { line: "Gross margin", amount: grossMargin },
    ...expensesByType.map((e) => ({
      line: `Expense: ${e.expenseType}`,
      amount: -Number(e._sum.amount || 0),
    })),
    { line: "Total expenses", amount: -totalExpenses },
    { line: "Net profit", amount: netProfit },
  ];

  return {
    ...baseMeta("profit-loss", period),
    kpis: [
      { key: "revenue", label: "Revenue", value: revenue, format: "currency" },
      { key: "gross", label: "Gross margin", value: grossMargin, format: "currency" },
      { key: "expenses", label: "Total expenses", value: totalExpenses, format: "currency" },
      { key: "net", label: "Net profit", value: netProfit, format: "currency" },
    ],
    columns: [
      { key: "line", label: "Line item" },
      { key: "amount", label: "Amount (PKR)", align: "right" },
    ],
    rows,
  };
}

async function cashPositionReport(period: ReportPeriod): Promise<ReportResult> {
  const cashInHand = await calculateCashInHand();

  const [cashSalesIn, cashAdvances, cashExpensesPeriod, cashExpensesAll] =
    await Promise.all([
      prisma.sale.aggregate({
        where: {
          status: "COMPLETED",
          paymentMethod: "CASH",
          createdAt: saleDateFilter(period),
        },
        _sum: { finalPrice: true },
      }),
      prisma.sale.aggregate({
        where: {
          status: "OPEN",
          saleType: "CUSTOM_ORDER",
          paymentMethod: "CASH",
          createdAt: saleDateFilter(period),
        },
        _sum: { advancePaid: true },
      }),
      prisma.expense.aggregate({
        where: {
          paymentMethod: "CASH",
          expenseDate: expenseDateFilter(period),
        },
        _sum: { amount: true },
      }),
      prisma.expense.aggregate({
        where: { paymentMethod: "CASH" },
        _sum: { amount: true },
      }),
    ]);

  const periodCashIn =
    Number(cashSalesIn._sum.finalPrice || 0) + Number(cashAdvances._sum.advancePaid || 0);
  const periodCashOut = Number(cashExpensesPeriod._sum.amount || 0);

  return {
    ...baseMeta("cash-position", period),
    kpis: [
      { key: "cash", label: "Cash in hand (now)", value: cashInHand, format: "currency" },
      { key: "in", label: "Cash in (period)", value: periodCashIn, format: "currency" },
      { key: "out", label: "Cash out (period)", value: periodCashOut, format: "currency" },
      {
        key: "net",
        label: "Net cash flow (period)",
        value: periodCashIn - periodCashOut,
        format: "currency",
      },
    ],
    columns: [
      { key: "metric", label: "Metric" },
      { key: "value", label: "Value (PKR)", align: "right" },
      { key: "scope", label: "Scope" },
    ],
    rows: [
      { metric: "Cash in hand", value: cashInHand, scope: "Current snapshot" },
      { metric: "Completed cash sales", value: Number(cashSalesIn._sum.finalPrice || 0), scope: "Period" },
      { metric: "Open custom order cash advances", value: Number(cashAdvances._sum.advancePaid || 0), scope: "Period" },
      { metric: "Cash expenses", value: periodCashOut, scope: "Period" },
      { metric: "All-time cash expenses", value: Number(cashExpensesAll._sum.amount || 0), scope: "All time" },
    ],
  };
}

async function salesRegisterReport(period: ReportPeriod): Promise<ReportResult> {
  const sales = await prisma.sale.findMany({
    where: {
      createdAt: saleDateFilter(period),
      status: { not: "CANCELLED" },
    },
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { name: true } },
      items: {
        select: {
          categoryName: true,
          stoneTypeName: true,
          stoneColorName: true,
          stoneCutName: true,
          stoneClarityName: true,
          stonePrice: true,
          inventoryItem: { select: { category: { select: { name: true } } } },
        },
      },
    },
  });

  const rows = sales.map((s) => ({
    date: new Date(s.createdAt).toLocaleDateString(),
    invoice: s.invoiceNumber || "—",
    customer: s.customer?.name || "—",
    type: s.saleType,
    source: s.source,
    status: s.status,
    payment: s.paymentMethod,
    total: Number(s.finalPrice),
    advance: s.advancePaid != null ? Number(s.advancePaid) : null,
    remaining: s.remainingAmount != null ? Number(s.remainingAmount) : null,
    items: formatSaleItemsSummary({
      source: s.source,
      orderDescription: s.orderDescription,
      items: s.items.map((i) => ({
        categoryName: i.categoryName,
        inventoryItem: i.inventoryItem,
        stoneTypeName: i.stoneTypeName,
        stoneColorName: i.stoneColorName,
        stoneCutName: i.stoneCutName,
        stoneClarityName: i.stoneClarityName,
        stonePrice: i.stonePrice != null ? Number(i.stonePrice) : null,
      })),
    }),
  }));

  const totalRevenue = rows.reduce((acc, r) => acc + Number(r.total || 0), 0);

  return {
    ...baseMeta("sales-register", period),
    kpis: [
      { key: "count", label: "Sales count", value: rows.length, format: "number" },
      { key: "total", label: "Total value", value: totalRevenue, format: "currency" },
    ],
    columns: [
      { key: "date", label: "Date" },
      { key: "invoice", label: "Invoice" },
      { key: "customer", label: "Customer" },
      { key: "type", label: "Type" },
      { key: "source", label: "Source" },
      { key: "status", label: "Status" },
      { key: "payment", label: "Payment" },
      { key: "total", label: "Total (PKR)", align: "right" },
      { key: "advance", label: "Advance", align: "right" },
      { key: "remaining", label: "Remaining", align: "right" },
      { key: "items", label: "Items summary" },
    ],
    rows,
  };
}

async function expenseBreakdownReport(
  period: ReportPeriod,
  context: ReportContext = {}
): Promise<ReportResult> {
  const expenses = await prisma.expense.findMany({
    where: {
      expenseDate: expenseDateFilter(period),
      ...(context.expenseType ? { expenseType: context.expenseType as "BEOPARI" | "KAREGAR" | "SHOP" | "HOME" } : {}),
    },
    orderBy: { expenseDate: "desc" },
    include: {
      beopari: { select: { name: true } },
      karegar: { select: { name: true } },
    },
  });

  const byType = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.expenseType] = (acc[e.expenseType] || 0) + Number(e.amount);
    return acc;
  }, {});

  const total = expenses.reduce((acc, e) => acc + Number(e.amount), 0);

  const rows = expenses.map((e) => ({
    date: new Date(e.expenseDate).toLocaleDateString(),
    type: e.expenseType,
    amount: Number(e.amount),
    payment: e.paymentMethod,
    beopari: e.beopari?.name || "—",
    karegar: e.karegar?.name || "—",
    description: (e.description || "—").replace(/\s+/g, " ").slice(0, 120),
  }));

  return {
    ...baseMeta("expense-breakdown", period),
    kpis: [
      { key: "total", label: "Total expenses", value: total, format: "currency" },
      { key: "beopari", label: "Beopari", value: byType.BEOPARI || 0, format: "currency" },
      { key: "karegar", label: "Karegar", value: byType.KAREGAR || 0, format: "currency" },
      { key: "shop", label: "Shop", value: byType.SHOP || 0, format: "currency" },
      { key: "home", label: "Home", value: byType.HOME || 0, format: "currency" },
    ],
    columns: [
      { key: "date", label: "Date" },
      { key: "type", label: "Type" },
      { key: "amount", label: "Amount (PKR)", align: "right" },
      { key: "payment", label: "Payment" },
      { key: "beopari", label: "Beopari" },
      { key: "karegar", label: "Karegar" },
      { key: "description", label: "Description" },
    ],
    rows,
  };
}

async function stockOnHandReport(period: ReportPeriod): Promise<ReportResult> {
  const items = await prisma.inventoryItem.findMany({
    where: { status: "AVAILABLE" },
    orderBy: { createdAt: "desc" },
    include: {
      category: { select: { name: true } },
    },
  });

  const rows = items.map((item) => ({
    sku: item.sku,
    category: item.category?.name || "—",
    quality: item.itemQuality,
    weight: Number(item.weightGrams).toFixed(3),
    silverRate: Number(item.silverRateAtPurchase),
    costPerGram: Number(item.purchasePricePerGram),
    stone: item.stoneTypeId ? "Yes" : "No",
    status: item.status,
    added: new Date(item.createdAt).toLocaleDateString(),
  }));

  const totalWeight = items.reduce((acc, i) => acc + Number(i.weightGrams), 0);
  const totalCost = items.reduce(
    (acc, i) => acc + Number(i.purchasePricePerGram) * Number(i.weightGrams),
    0
  );

  return {
    ...baseMeta("stock-on-hand", period),
    kpis: [
      { key: "count", label: "Available items", value: items.length, format: "number" },
      { key: "weight", label: "Total weight (g)", value: Math.round(totalWeight * 1000) / 1000, format: "number" },
      { key: "cost", label: "Est. purchase value", value: Math.round(totalCost * 100) / 100, format: "currency" },
    ],
    columns: [
      { key: "sku", label: "SKU" },
      { key: "category", label: "Category" },
      { key: "quality", label: "Quality" },
      { key: "weight", label: "Weight (g)", align: "right" },
      { key: "silverRate", label: "Silver rate", align: "right" },
      { key: "costPerGram", label: "Cost/g", align: "right" },
      { key: "stone", label: "Stone" },
      { key: "status", label: "Status" },
      { key: "added", label: "Added" },
    ],
    rows,
  };
}

async function customOrdersReport(period: ReportPeriod): Promise<ReportResult> {
  const sales = await prisma.sale.findMany({
    where: {
      saleType: "CUSTOM_ORDER",
      createdAt: saleDateFilter(period),
      status: { not: "CANCELLED" },
    },
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { name: true } },
      workshopOrder: { include: { karegar: { select: { name: true } } } },
    },
  });

  const rows = sales.map((s) => ({
    date: new Date(s.createdAt).toLocaleDateString(),
    invoice: s.invoiceNumber || "—",
    customer: s.customer?.name || "—",
    source: s.source,
    status: s.status,
    advance: s.advancePaid != null ? Number(s.advancePaid) : 0,
    remaining: s.remainingAmount != null ? Number(s.remainingAmount) : 0,
    total: Number(s.finalPrice),
    pickup: s.pickupDate ? new Date(s.pickupDate).toLocaleDateString() : "—",
    workshop: s.workshopOrder?.status || "—",
    karegar: s.workshopOrder?.karegar?.name || "—",
  }));

  const openCount = rows.filter((r) => r.status === "OPEN").length;

  return {
    ...baseMeta("custom-orders", period),
    kpis: [
      { key: "count", label: "Custom orders", value: rows.length, format: "number" },
      { key: "open", label: "Open", value: openCount, format: "number" },
      {
        key: "value",
        label: "Total value",
        value: rows.reduce((a, r) => a + Number(r.total), 0),
        format: "currency",
      },
    ],
    columns: [
      { key: "date", label: "Date" },
      { key: "invoice", label: "Invoice" },
      { key: "customer", label: "Customer" },
      { key: "source", label: "Source" },
      { key: "status", label: "Status" },
      { key: "advance", label: "Advance", align: "right" },
      { key: "remaining", label: "Remaining", align: "right" },
      { key: "total", label: "Total", align: "right" },
      { key: "pickup", label: "Pickup" },
      { key: "workshop", label: "Workshop" },
      { key: "karegar", label: "Karegar" },
    ],
    rows,
  };
}

async function beopariSummaryReport(period: ReportPeriod): Promise<ReportResult> {
  const beoparis = await prisma.beopari.findMany({
    orderBy: { name: "asc" },
    include: {
      purchases: { include: { allocations: { select: { amount: true } } } },
      expenses: { include: { beopariAllocations: { select: { amount: true } } } },
    },
  });

  const rows = beoparis.map((b) => {
    const total = b.purchases.reduce((a, p) => a + Number(p.totalCost), 0);
    const paid = b.expenses.reduce(
      (a, e) => a + e.beopariAllocations.reduce((a2, x) => a2 + Number(x.amount), 0),
      0
    );
    return {
      name: b.name,
      purchases: b.purchases.length,
      total,
      paid,
      remaining: total - paid,
    };
  });

  const totalRemaining = rows.reduce((a, r) => a + Number(r.remaining), 0);

  return {
    ...baseMeta("beopari-summary", period),
    kpis: [
      { key: "suppliers", label: "Suppliers", value: rows.length, format: "number" },
      { key: "remaining", label: "Total remaining", value: totalRemaining, format: "currency" },
    ],
    columns: [
      { key: "name", label: "Beopari" },
      { key: "purchases", label: "Purchases", align: "right" },
      { key: "total", label: "Total (PKR)", align: "right" },
      { key: "paid", label: "Paid", align: "right" },
      { key: "remaining", label: "Remaining", align: "right" },
    ],
    rows,
  };
}

async function supplierStatementReport(
  period: ReportPeriod,
  context: ReportContext
): Promise<ReportResult> {
  if (!context.beopariId) {
    throw new Error("beopariId is required for supplier statement");
  }

  const ledger = await aggregateBeopariLedger(context.beopariId);
  if (!ledger) throw new Error("Beopari not found");

  const purchaseRows = ledger.purchases
    .filter((p) => {
      const d = new Date(p.purchaseDate);
      return d >= period.from && d <= period.to;
    })
    .map((p) => ({
      date: new Date(p.purchaseDate).toLocaleDateString(),
      type: "Purchase",
      category: p.categoryName,
      amount: Number(p.totalCost),
      paid: p.paidAmount,
      remaining: p.remainingAmount,
      notes: p.notes || "—",
    }));

  const paymentRows = ledger.paymentHistory
    .filter((e) => {
      const d = new Date(e.expenseDate);
      return d >= period.from && d <= period.to;
    })
    .map((e) => ({
      date: new Date(e.expenseDate).toLocaleDateString(),
      type: "Payment",
      category: "—",
      amount: -e.amount,
      paid: e.amount,
      remaining: 0,
      notes: (e.description || e.paymentMethod).replace(/\s+/g, " ").slice(0, 80),
    }));

  const rows = [...purchaseRows, ...paymentRows].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return {
    ...baseMeta("supplier-statement", period),
    title: `Supplier Statement — ${ledger.name}`,
    kpis: [
      { key: "total", label: "All-time total", value: ledger.totalAmount, format: "currency" },
      { key: "paid", label: "All-time paid", value: ledger.paidAmount, format: "currency" },
      { key: "remaining", label: "Remaining", value: ledger.remainingAmount, format: "currency" },
      { key: "periodLines", label: "Lines in period", value: rows.length, format: "number" },
    ],
    columns: [
      { key: "date", label: "Date" },
      { key: "type", label: "Type" },
      { key: "category", label: "Category" },
      { key: "amount", label: "Amount", align: "right" },
      { key: "paid", label: "Paid", align: "right" },
      { key: "remaining", label: "Remaining", align: "right" },
      { key: "notes", label: "Notes" },
    ],
    rows,
  };
}

async function karegarPaymentsReport(
  period: ReportPeriod,
  context: ReportContext = {}
): Promise<ReportResult> {
  const expenses = await prisma.expense.findMany({
    where: {
      expenseType: "KAREGAR",
      expenseDate: expenseDateFilter(period),
      ...(context.karegarId ? { karegarId: context.karegarId } : {}),
    },
    orderBy: { expenseDate: "desc" },
    include: {
      karegar: { select: { name: true } },
      workshopAllocations: {
        include: {
          workshopOrder: {
            include: { sale: { select: { invoiceNumber: true } } },
          },
        },
      },
    },
  });

  const rows = expenses.flatMap((e) => {
    if (!e.workshopAllocations.length) {
      return [
        {
          date: new Date(e.expenseDate).toLocaleDateString(),
          karegar: e.karegar?.name || "—",
          amount: Number(e.amount),
          invoice: "—",
          allocation: Number(e.amount),
        },
      ];
    }
    return e.workshopAllocations.map((a) => ({
      date: new Date(e.expenseDate).toLocaleDateString(),
      karegar: e.karegar?.name || "—",
      amount: Number(e.amount),
      invoice: a.workshopOrder?.sale?.invoiceNumber || "—",
      allocation: Number(a.amount),
    }));
  });

  const total = expenses.reduce((a, e) => a + Number(e.amount), 0);

  return {
    ...baseMeta("karegar-payments", period),
    kpis: [
      { key: "payments", label: "Payment records", value: expenses.length, format: "number" },
      { key: "total", label: "Total paid", value: total, format: "currency" },
    ],
    columns: [
      { key: "date", label: "Date" },
      { key: "karegar", label: "Karegar" },
      { key: "amount", label: "Expense total", align: "right" },
      { key: "invoice", label: "Invoice" },
      { key: "allocation", label: "Allocated", align: "right" },
    ],
    rows,
  };
}

async function workshopQueueReport(period: ReportPeriod): Promise<ReportResult> {
  const orders = await prisma.workshopOrder.findMany({
    where: { createdAt: saleDateFilter(period) },
    orderBy: { createdAt: "desc" },
    include: {
      karegar: { select: { name: true } },
      sale: {
        include: {
          customer: { select: { name: true } },
          items: {
            select: {
              categoryName: true,
              inventoryItem: { select: { category: { select: { name: true } } } },
              stoneTypeName: true,
              stoneColorName: true,
              stoneCutName: true,
              stoneClarityName: true,
              stonePrice: true,
            },
          },
        },
      },
    },
  });

  const rows = orders.map((o) => ({
    date: new Date(o.createdAt).toLocaleDateString(),
    invoice: o.sale.invoiceNumber || "—",
    customer: o.sale.customer?.name || "—",
    status: o.status,
    karegar: o.karegar?.name || "—",
    saleStatus: o.sale.status,
    items: formatSaleItemsSummary({
      source: o.sale.source,
      orderDescription: o.sale.orderDescription,
      items: o.sale.items.map((i) => ({
        categoryName: i.categoryName,
        inventoryItem: i.inventoryItem,
        stoneTypeName: i.stoneTypeName,
        stoneColorName: i.stoneColorName,
        stoneCutName: i.stoneCutName,
        stoneClarityName: i.stoneClarityName,
        stonePrice: i.stonePrice != null ? Number(i.stonePrice) : null,
      })),
    }),
  }));

  const complete = rows.filter((r) => r.status === "COMPLETE").length;

  return {
    ...baseMeta("workshop-queue", period),
    kpis: [
      { key: "orders", label: "Workshop orders", value: rows.length, format: "number" },
      { key: "complete", label: "Complete", value: complete, format: "number" },
      { key: "pending", label: "Pending", value: rows.length - complete, format: "number" },
    ],
    columns: [
      { key: "date", label: "Date" },
      { key: "invoice", label: "Invoice" },
      { key: "customer", label: "Customer" },
      { key: "status", label: "Workshop status" },
      { key: "karegar", label: "Karegar" },
      { key: "saleStatus", label: "Sale status" },
      { key: "items", label: "Items" },
    ],
    rows,
  };
}

async function salesMarginReport(period: ReportPeriod): Promise<ReportResult> {
  const items = await prisma.saleItem.findMany({
    where: {
      inventoryItemId: { not: null },
      sale: {
        createdAt: saleDateFilter(period),
        status: "COMPLETED",
        source: "INVENTORY",
      },
    },
    orderBy: { createdAt: "desc" },
    include: {
      sale: {
        include: { customer: { select: { name: true } } },
      },
      inventoryItem: {
        select: { sku: true, category: { select: { name: true } } },
      },
    },
  });

  const rows = items.map((item) => {
    const suggested = Number(item.suggestedSalePrice);
    const final = Number(item.finalPrice);
    const cost = Number(item.purchasePricePerPiece);
    const margin = final - cost;
    const marginPct = final > 0 ? Math.round((margin / final) * 1000) / 10 : 0;

    return {
      date: new Date(item.sale.createdAt).toLocaleDateString(),
      invoice: item.sale.invoiceNumber || "—",
      customer: item.sale.customer?.name || "—",
      sku: item.inventoryItem?.sku || "—",
      category: item.inventoryItem?.category?.name || item.categoryName || "—",
      suggested,
      final,
      cost,
      margin,
      marginPct: `${marginPct}%`,
    };
  });

  const totalRevenue = rows.reduce((a, r) => a + Number(r.final), 0);
  const totalCost = rows.reduce((a, r) => a + Number(r.cost), 0);
  const totalMargin = totalRevenue - totalCost;

  return {
    ...baseMeta("sales-margin", period),
    kpis: [
      { key: "items", label: "Items sold", value: rows.length, format: "number" },
      { key: "revenue", label: "Revenue", value: totalRevenue, format: "currency" },
      { key: "cost", label: "Purchase cost", value: totalCost, format: "currency" },
      { key: "margin", label: "Gross margin", value: totalMargin, format: "currency" },
    ],
    columns: [
      { key: "date", label: "Date" },
      { key: "invoice", label: "Invoice" },
      { key: "customer", label: "Customer" },
      { key: "sku", label: "SKU" },
      { key: "category", label: "Category" },
      { key: "suggested", label: "Suggested", align: "right" },
      { key: "final", label: "Final price", align: "right" },
      { key: "cost", label: "Purchase cost", align: "right" },
      { key: "margin", label: "Margin", align: "right" },
      { key: "marginPct", label: "Margin %" },
    ],
    rows,
  };
}

async function inventoryValuationReport(period: ReportPeriod): Promise<ReportResult> {
  const [items, pricingConfig, silverRate] = await Promise.all([
    prisma.inventoryItem.findMany({
      where: { status: "AVAILABLE" },
      include: { category: { select: { name: true } } },
    }),
    getPricingConfig(),
    getCurrentSilverRate(),
  ]);

  const byCategory = new Map<
    string,
    { count: number; weight: number; purchaseCost: number; estimatedValue: number }
  >();

  for (const item of items) {
    const category = item.category?.name || "Uncategorized";
    const weight = Number(item.weightGrams);
    const purchaseCost = Number(item.purchasePricePerPiece);
    const estimated = priceItem(
      {
        todaySilverRate: silverRate.ratePerGram,
        weightGrams: weight,
        stonePrice: item.stonePrice != null ? Number(item.stonePrice) : 0,
        itemQuality: item.itemQuality,
      },
      pricingConfig
    ).suggestedSalePrice;

    const existing = byCategory.get(category) || {
      count: 0,
      weight: 0,
      purchaseCost: 0,
      estimatedValue: 0,
    };
    existing.count += 1;
    existing.weight += weight;
    existing.purchaseCost += purchaseCost;
    existing.estimatedValue += estimated;
    byCategory.set(category, existing);
  }

  const rows = Array.from(byCategory.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, stats]) => ({
      category,
      items: stats.count,
      weight: Math.round(stats.weight * 1000) / 1000,
      purchaseCost: Math.round(stats.purchaseCost * 100) / 100,
      estimatedValue: Math.round(stats.estimatedValue * 100) / 100,
      silverRate: silverRate.ratePerGram,
    }));

  const totals = rows.reduce(
    (acc, r) => ({
      count: acc.count + Number(r.items),
      weight: acc.weight + Number(r.weight),
      purchaseCost: acc.purchaseCost + Number(r.purchaseCost),
      estimatedValue: acc.estimatedValue + Number(r.estimatedValue),
    }),
    { count: 0, weight: 0, purchaseCost: 0, estimatedValue: 0 }
  );

  return {
    ...baseMeta("inventory-valuation", period),
    kpis: [
      { key: "items", label: "Available items", value: totals.count, format: "number" },
      { key: "weight", label: "Total weight (g)", value: Math.round(totals.weight * 1000) / 1000, format: "number" },
      { key: "cost", label: "Purchase value", value: totals.purchaseCost, format: "currency" },
      { key: "estimate", label: "Est. at silver rate", value: totals.estimatedValue, format: "currency" },
      { key: "rate", label: "Silver rate (PKR/g)", value: silverRate.ratePerGram, format: "number" },
    ],
    columns: [
      { key: "category", label: "Category" },
      { key: "items", label: "Items", align: "right" },
      { key: "weight", label: "Weight (g)", align: "right" },
      { key: "purchaseCost", label: "Purchase cost", align: "right" },
      { key: "estimatedValue", label: "Est. value", align: "right" },
      { key: "silverRate", label: "Rate used", align: "right" },
    ],
    rows,
  };
}

async function agingStockReport(
  period: ReportPeriod,
  context: ReportContext = {}
): Promise<ReportResult> {
  const now = Date.now();
  const items = await prisma.inventoryItem.findMany({
    where: {
      status: "AVAILABLE",
      ...(context.categoryId ? { categoryId: context.categoryId } : {}),
    },
    orderBy: { createdAt: "asc" },
    include: { category: { select: { name: true } } },
  });

  const rows = items.map((item) => {
    const days = Math.floor((now - item.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    return {
      sku: item.sku,
      category: item.category?.name || "—",
      quality: item.itemQuality,
      weight: Number(item.weightGrams).toFixed(3),
      purchaseCost: Number(item.purchasePricePerPiece),
      days,
      added: new Date(item.createdAt).toLocaleDateString(),
    };
  });

  const over90 = rows.filter((r) => Number(r.days) >= 90).length;
  const over30 = rows.filter((r) => Number(r.days) >= 30).length;

  return {
    ...baseMeta("aging-stock", period),
    kpis: [
      { key: "count", label: "Available items", value: rows.length, format: "number" },
      { key: "over30", label: "30+ days", value: over30, format: "number" },
      { key: "over90", label: "90+ days", value: over90, format: "number" },
      {
        key: "avg",
        label: "Avg age (days)",
        value: rows.length
          ? Math.round(rows.reduce((a, r) => a + Number(r.days), 0) / rows.length)
          : 0,
        format: "number",
      },
    ],
    columns: [
      { key: "sku", label: "SKU" },
      { key: "category", label: "Category" },
      { key: "quality", label: "Quality" },
      { key: "weight", label: "Weight (g)", align: "right" },
      { key: "purchaseCost", label: "Purchase cost", align: "right" },
      { key: "days", label: "Age (days)", align: "right" },
      { key: "added", label: "Added" },
    ],
    rows,
  };
}

type CustomerAgg = {
  id: string;
  name: string;
  phone: string;
  count: number;
  total: number;
  lastPurchase: Date;
};

async function aggregateCustomersInPeriod(period: ReportPeriod): Promise<CustomerAgg[]> {
  const sales = await prisma.sale.findMany({
    where: {
      createdAt: saleDateFilter(period),
      status: "COMPLETED",
      customerId: { not: null },
    },
    include: { customer: { select: { id: true, name: true, phone: true } } },
  });

  const map = new Map<string, CustomerAgg>();

  for (const sale of sales) {
    if (!sale.customer) continue;
    const id = sale.customer.id;
    const existing = map.get(id);
    const amount = Number(sale.finalPrice);
    const createdAt = sale.createdAt;

    if (!existing) {
      map.set(id, {
        id,
        name: sale.customer.name,
        phone: sale.customer.phone || "—",
        count: 1,
        total: amount,
        lastPurchase: createdAt,
      });
    } else {
      existing.count += 1;
      existing.total += amount;
      if (createdAt > existing.lastPurchase) existing.lastPurchase = createdAt;
    }
  }

  return Array.from(map.values());
}

async function customerSummaryReport(period: ReportPeriod): Promise<ReportResult> {
  const customers = await aggregateCustomersInPeriod(period);

  const rows = customers
    .sort((a, b) => b.total - a.total)
    .map((c) => ({
      customer: c.name,
      phone: c.phone,
      purchases: c.count,
      total: Math.round(c.total * 100) / 100,
      lastPurchase: c.lastPurchase.toLocaleDateString(),
    }));

  const grandTotal = customers.reduce((a, c) => a + c.total, 0);

  return {
    ...baseMeta("customer-summary", period),
    kpis: [
      { key: "customers", label: "Active customers", value: customers.length, format: "number" },
      { key: "purchases", label: "Completed sales", value: rows.reduce((a, r) => a + Number(r.purchases), 0), format: "number" },
      { key: "revenue", label: "Total revenue", value: grandTotal, format: "currency" },
    ],
    columns: [
      { key: "customer", label: "Customer" },
      { key: "phone", label: "Phone" },
      { key: "purchases", label: "Purchases", align: "right" },
      { key: "total", label: "Total spent", align: "right" },
      { key: "lastPurchase", label: "Last purchase" },
    ],
    rows,
  };
}

async function topCustomersReport(period: ReportPeriod): Promise<ReportResult> {
  const customers = await aggregateCustomersInPeriod(period);
  const sorted = customers.sort((a, b) => b.total - a.total).slice(0, 50);

  const rows = sorted.map((c, idx) => ({
    rank: idx + 1,
    customer: c.name,
    phone: c.phone,
    purchases: c.count,
    total: Math.round(c.total * 100) / 100,
    avgTicket: Math.round((c.total / c.count) * 100) / 100,
  }));

  return {
    ...baseMeta("top-customers", period),
    kpis: [
      { key: "top", label: "Customers listed", value: rows.length, format: "number" },
      {
        key: "topRevenue",
        label: "Top 50 revenue",
        value: rows.reduce((a, r) => a + Number(r.total), 0),
        format: "currency",
      },
    ],
    columns: [
      { key: "rank", label: "Rank", align: "right" },
      { key: "customer", label: "Customer" },
      { key: "phone", label: "Phone" },
      { key: "purchases", label: "Purchases", align: "right" },
      { key: "total", label: "Total spent", align: "right" },
      { key: "avgTicket", label: "Avg ticket", align: "right" },
    ],
    rows,
  };
}

async function customerStatementReport(
  period: ReportPeriod,
  context: ReportContext
): Promise<ReportResult> {
  if (!context.customerId) {
    throw new Error("customerId is required for customer statement");
  }

  const customer = await prisma.customer.findUnique({
    where: { id: context.customerId },
    select: { name: true, phone: true },
  });

  if (!customer) throw new Error("Customer not found");

  const sales = await prisma.sale.findMany({
    where: {
      customerId: context.customerId,
      createdAt: saleDateFilter(period),
      status: { not: "CANCELLED" },
    },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        select: {
          categoryName: true,
          inventoryItem: { select: { category: { select: { name: true } } } },
          stoneTypeName: true,
          stoneColorName: true,
          stoneCutName: true,
          stoneClarityName: true,
          stonePrice: true,
        },
      },
    },
  });

  const rows = sales.map((s) => ({
    date: new Date(s.createdAt).toLocaleDateString(),
    invoice: s.invoiceNumber || "—",
    type: s.saleType,
    status: s.status,
    total: Number(s.finalPrice),
    items: formatSaleItemsSummary({
      source: s.source,
      orderDescription: s.orderDescription,
      items: s.items.map((i) => ({
        categoryName: i.categoryName,
        inventoryItem: i.inventoryItem,
        stoneTypeName: i.stoneTypeName,
        stoneColorName: i.stoneColorName,
        stoneCutName: i.stoneCutName,
        stoneClarityName: i.stoneClarityName,
        stonePrice: i.stonePrice != null ? Number(i.stonePrice) : null,
      })),
    }),
  }));

  const total = rows.reduce((a, r) => a + Number(r.total), 0);

  return {
    ...baseMeta("customer-statement", period),
    title: `Customer Statement — ${customer.name}`,
    kpis: [
      { key: "purchases", label: "Purchases", value: rows.length, format: "number" },
      { key: "total", label: "Total", value: total, format: "currency" },
    ],
    columns: [
      { key: "date", label: "Date" },
      { key: "invoice", label: "Invoice" },
      { key: "type", label: "Type" },
      { key: "status", label: "Status" },
      { key: "total", label: "Total (PKR)", align: "right" },
      { key: "items", label: "Items" },
    ],
    rows,
  };
}

export async function generateReport(
  reportId: string,
  period: ReportPeriod,
  context: ReportContext = {}
): Promise<ReportResult> {
  switch (reportId) {
    case "profit-loss":
      return profitLossReport(period);
    case "cash-position":
      return cashPositionReport(period);
    case "sales-register":
      return salesRegisterReport(period);
    case "sales-margin":
      return salesMarginReport(period);
    case "custom-orders":
      return customOrdersReport(period);
    case "expense-breakdown":
      return expenseBreakdownReport(period, context);
    case "stock-on-hand":
      return stockOnHandReport(period);
    case "inventory-valuation":
      return inventoryValuationReport(period);
    case "aging-stock":
      return agingStockReport(period, context);
    case "beopari-summary":
      return beopariSummaryReport(period);
    case "supplier-statement":
      return supplierStatementReport(period, context);
    case "karegar-payments":
      return karegarPaymentsReport(period, context);
    case "workshop-queue":
      return workshopQueueReport(period);
    case "customer-summary":
      return customerSummaryReport(period);
    case "top-customers":
      return topCustomersReport(period);
    case "customer-statement":
      return customerStatementReport(period, context);
    default:
      throw new Error("Unknown report");
  }
}
