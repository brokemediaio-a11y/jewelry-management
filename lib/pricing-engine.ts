import { roundPKR } from './currency-utils';
import {
  DEFAULT_PRICING_CONFIG,
  getCategoryQuotient as getQuotientFromConfig,
  calculateItemSuggestedPrice as calculateFromConfig,
  type PricingConfig,
  type PricingItemInput,
} from './pricing-config';

export type { PricingConfig, QuotientRule, PricingItemInput } from './pricing-config';
export { DEFAULT_PRICING_CONFIG } from './pricing-config';

export interface PricedItem extends PricingItemInput {
  categoryQuotient: number;
  suggestedSalePrice: number;
}

export function getCategoryQuotient(
  categoryName: string,
  config: PricingConfig = DEFAULT_PRICING_CONFIG
): number {
  return getQuotientFromConfig(categoryName, config);
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
  const categoryQuotient = getCategoryQuotient(input.categoryName, config);
  const suggestedSalePrice = calculateItemSuggestedPrice(input, config);

  return {
    ...input,
    categoryQuotient,
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
