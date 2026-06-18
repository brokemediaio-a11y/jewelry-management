import { prisma } from "@/lib/prisma";

/**
 * Cash in hand per implementation_stage2.md §8.2:
 * - COMPLETED CASH sales → finalPrice (includes full custom order total once completed)
 * - OPEN custom orders with CASH advance → advancePaid only (remaining not yet collected)
 * - Minus all CASH expenses
 */
export async function calculateCashInHand(): Promise<number> {
  const [completedCashAgg, openAdvanceCashAgg, cashExpenseAgg] = await Promise.all([
    prisma.sale.aggregate({
      where: { status: "COMPLETED", paymentMethod: "CASH" },
      _sum: { finalPrice: true },
    }),
    prisma.sale.aggregate({
      where: {
        status: "OPEN",
        saleType: "CUSTOM_ORDER",
        paymentMethod: "CASH",
      },
      _sum: { advancePaid: true },
    }),
    prisma.expense.aggregate({
      where: { paymentMethod: "CASH" },
      _sum: { amount: true },
    }),
  ]);

  const completedCash = Number(completedCashAgg._sum.finalPrice || 0);
  const openAdvanceCash = Number(openAdvanceCashAgg._sum.advancePaid || 0);
  const cashExpenses = Number(cashExpenseAgg._sum.amount || 0);

  return completedCash + openAdvanceCash - cashExpenses;
}
