import { WorkshopOrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const ALLOWED_TRANSITIONS: Record<WorkshopOrderStatus, WorkshopOrderStatus[]> = {
  SENT_TO_WORKSHOP: ["IN_PROGRESS"],
  IN_PROGRESS: ["COMPLETE"],
  COMPLETE: [],
};

export function isValidStatusTransition(
  from: WorkshopOrderStatus,
  to: WorkshopOrderStatus
): boolean {
  if (from === to) return true;
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export async function createWorkshopOrderForSale(saleId: string) {
  return prisma.workshopOrder.create({
    data: {
      saleId,
      status: "SENT_TO_WORKSHOP",
    },
  });
}

