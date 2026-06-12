import { StoneOptionKind } from '@prisma/client';
import { formatPKR } from '@/lib/currency-utils';

export const STONE_KIND_LABELS: Record<StoneOptionKind, string> = {
  TYPE: 'Stone Type',
  COLOR: 'Stone Color',
  CUT: 'Stone Cut',
  CLARITY: 'Stone Clarity',
};

export const inventoryStoneInclude = {
  stoneType: { select: { id: true, name: true, kind: true } },
  stoneColor: { select: { id: true, name: true, kind: true } },
  stoneCut: { select: { id: true, name: true, kind: true } },
  stoneClarity: { select: { id: true, name: true, kind: true } },
} as const;

type StoneRelation = { name: string } | null | undefined;

export function formatItemQuality(quality: 'PREMIUM' | 'LOCAL'): string {
  return quality === 'PREMIUM' ? 'Premium' : 'Local';
}

export function formatStoneConfiguration(item: {
  stoneType?: StoneRelation;
  stoneColor?: StoneRelation;
  stoneCut?: StoneRelation;
  stoneClarity?: StoneRelation;
  stonePrice?: number | null;
}): string | null {
  const parts = [
    item.stoneType?.name,
    item.stoneColor?.name,
    item.stoneCut?.name,
    item.stoneClarity?.name,
  ].filter(Boolean);

  if (parts.length === 0) return null;

  const summary = parts.join(' · ');
  if (item.stonePrice != null && item.stonePrice > 0) {
    return `${summary} (${formatPKR(item.stonePrice)})`;
  }

  return summary;
}

export function formatStoneSnapshot(item: {
  stoneTypeName?: string | null;
  stoneColorName?: string | null;
  stoneCutName?: string | null;
  stoneClarityName?: string | null;
  stonePrice?: number | null;
}): string | null {
  const parts = [
    item.stoneTypeName,
    item.stoneColorName,
    item.stoneCutName,
    item.stoneClarityName,
  ].filter(Boolean);

  if (parts.length === 0) return null;

  const summary = parts.join(' · ');
  if (item.stonePrice != null && item.stonePrice > 0) {
    return `${summary} (${formatPKR(item.stonePrice)})`;
  }

  return summary;
}
