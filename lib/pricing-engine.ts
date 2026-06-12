import { roundPKR } from './currency-utils';
import {
  DEFAULT_PRICING_CONFIG,
  getQualityQuotient as getQuotientFromConfig,
  calculateItemSuggestedPrice as calculateFromConfig,
  type PricingConfig,
  type PricingItemInput,
} from './pricing-config';

export type { PricingConfig, PricingItemInput, ItemQuality } from './pricing-config';
export { DEFAULT_PRICING_CONFIG } from './pricing-config';

export interface PricedItem extends PricingItemInput {
  qualityQuotient: number;
  suggestedSalePrice: number;
}

export function getQualityQuotient(
  itemQuality: PricingItemInput['itemQuality'],
  config: PricingConfig = DEFAULT_PRICING_CONFIG
): number {
  return getQuotientFromConfig(itemQuality, config);
}

export function calculateItemSuggestedPrice(
  input: PricingItemInput,
  config: PricingConfig = DEFAULT_PRICING_CONFIG
): number {
  return calculateFromConfig(input, config);
}

export function priceItem(
  input: PricingItemInput,
  config: PricingConfig = DEFAULT_PRICING_CONFIG
): PricedItem {
  const qualityQuotient = getQualityQuotient(input.itemQuality, config);
  const suggestedSalePrice = calculateItemSuggestedPrice(input, config);

  return {
    ...input,
    qualityQuotient,
    suggestedSalePrice,
  };
}

export function calculateSuggestedTotal(
  items: Array<{ suggestedSalePrice: number }>
): number {
  return roundPKR(items.reduce((sum, item) => sum + item.suggestedSalePrice, 0));
}

export function calculateFinalTotal(items: Array<{ finalPrice: number }>): number {
  return roundPKR(items.reduce((sum, item) => sum + item.finalPrice, 0));
}

export function getMinSalePrice(purchasePricePerPiece: number): number {
  return roundPKR(purchasePricePerPiece);
}
