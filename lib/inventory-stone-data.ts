import { Prisma } from '@prisma/client';

type StoneInput = {
  itemQuality: 'PREMIUM' | 'LOCAL';
  hasStoneConfig?: boolean;
  stoneTypeId?: string | null;
  stoneColorId?: string | null;
  stoneCutId?: string | null;
  stoneClarityId?: string | null;
  stonePrice?: number | null;
};

export function buildInventoryStoneCreateData(data: StoneInput) {
  const hasStone = Boolean(data.hasStoneConfig);

  return {
    itemQuality: data.itemQuality,
    stoneTypeId: hasStone ? data.stoneTypeId ?? null : null,
    stoneColorId: hasStone ? data.stoneColorId ?? null : null,
    stoneCutId: hasStone ? data.stoneCutId ?? null : null,
    stoneClarityId: hasStone ? data.stoneClarityId ?? null : null,
    stonePrice:
      hasStone && data.stonePrice != null
        ? new Prisma.Decimal(Number(data.stonePrice))
        : null,
  };
}

export function buildInventoryStoneUpdateData(
  data: Partial<StoneInput>
): Prisma.InventoryItemUpdateInput {
  const update: Prisma.InventoryItemUpdateInput = {};

  if (data.itemQuality !== undefined) {
    update.itemQuality = data.itemQuality;
  }

  if (data.hasStoneConfig === false) {
    update.stoneType = { disconnect: true };
    update.stoneColor = { disconnect: true };
    update.stoneCut = { disconnect: true };
    update.stoneClarity = { disconnect: true };
    update.stonePrice = null;
    return update;
  }

  if (data.hasStoneConfig === true) {
    if (data.stoneTypeId) {
      update.stoneType = { connect: { id: data.stoneTypeId } };
    }
    if (data.stoneColorId) {
      update.stoneColor = { connect: { id: data.stoneColorId } };
    }
    if (data.stoneCutId) {
      update.stoneCut = { connect: { id: data.stoneCutId } };
    }
    if (data.stoneClarityId) {
      update.stoneClarity = { connect: { id: data.stoneClarityId } };
    }
    if (data.stonePrice != null) {
      update.stonePrice = new Prisma.Decimal(Number(data.stonePrice));
    }
  }

  return update;
}
