import { prisma } from "@/lib/prisma";

export type AppNotification = {
  id: string;
  type: "custom_order_due" | "workshop_stuck" | "beopari_balance";
  title: string;
  description: string;
  href: string;
  severity: "info" | "warning" | "urgent";
};

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfToday(): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

export async function getAppNotifications(): Promise<AppNotification[]> {
  const todayStart = startOfToday();
  const todayEnd = endOfToday();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [ordersDueToday, stuckWorkshop, beopariWithBalance] = await Promise.all([
    prisma.sale.findMany({
      where: {
        status: "OPEN",
        saleType: "CUSTOM_ORDER",
        pickupDate: { gte: todayStart, lte: todayEnd },
      },
      take: 10,
      orderBy: { pickupDate: "asc" },
      select: {
        id: true,
        invoiceNumber: true,
        pickupDate: true,
        customer: { select: { name: true } },
      },
    }),
    prisma.workshopOrder.findMany({
      where: {
        status: { not: "COMPLETE" },
        createdAt: { lte: sevenDaysAgo },
      },
      take: 10,
      orderBy: { createdAt: "asc" },
      include: {
        sale: {
          select: {
            id: true,
            invoiceNumber: true,
            customer: { select: { name: true } },
          },
        },
        karegar: { select: { name: true } },
      },
    }),
    prisma.beopari.findMany({
      include: {
        purchases: { include: { allocations: { select: { amount: true } } } },
      },
    }),
  ]);

  const notifications: AppNotification[] = [];

  for (const sale of ordersDueToday) {
    notifications.push({
      id: `due-${sale.id}`,
      type: "custom_order_due",
      title: "Custom order due today",
      description: `${sale.invoiceNumber || "Order"} — ${sale.customer?.name || "Walk-in"}`,
      href: `/dashboard/sales/${sale.id}`,
      severity: "urgent",
    });
  }

  for (const order of stuckWorkshop) {
    notifications.push({
      id: `stuck-${order.id}`,
      type: "workshop_stuck",
      title: "Workshop job stuck > 7 days",
      description: `${order.sale.invoiceNumber || "Order"} — ${order.karegar?.name || "Unassigned"}`,
      href: `/dashboard/sales/${order.sale.id}`,
      severity: "warning",
    });
  }

  for (const b of beopariWithBalance) {
    const total = b.purchases.reduce((acc, p) => acc + Number(p.totalCost), 0);
    const paid = b.purchases.reduce(
      (acc, p) => acc + p.allocations.reduce((a2, a) => a2 + Number(a.amount), 0),
      0
    );
    const remaining = total - paid;
    if (remaining > 0.009) {
      notifications.push({
        id: `beopari-${b.id}`,
        type: "beopari_balance",
        title: "Beopari balance outstanding",
        description: `${b.name} — Rs. ${remaining.toFixed(0)} remaining`,
        href: `/dashboard/beopari/${b.id}`,
        severity: "info",
      });
    }
  }

  const severityOrder = { urgent: 0, warning: 1, info: 2 };
  return notifications.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}
