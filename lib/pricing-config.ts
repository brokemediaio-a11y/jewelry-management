import { roundPKR } from '@/lib/currency-utils';

export type ItemQuality = 'PREMIUM' | 'LOCAL';

export interface PricingItemInput {
  todaySilverRate: number;
  weightGrams: number;
  stonePrice: number;
  itemQuality: ItemQuality;
}

export const PRICING_CONFIG_KEY = 'pricing_config';

export interface PricingConfig {
  formula: string;
  premiumQuotient: number;
  localQuotient: number;
}

export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  formula: '((silverRate * weightGrams) + stonePrice) * quotient',
  premiumQuotient: 4,
  localQuotient: 2,
};

const FORMULA_VARIABLES = [
  'silverRate',
  'weightGrams',
  'stonePrice',
  'quotient',
] as const;

export function evaluateFormula(
  formula: string,
  variables: Record<(typeof FORMULA_VARIABLES)[number], number>
): number {
  let expression = formula;

  for (const key of FORMULA_VARIABLES) {
    expression = expression.replace(
      new RegExp(`\\b${key}\\b`, 'g'),
      String(variables[key])
    );
  }

  if (!/^[\d\s+\-*/().]+$/.test(expression)) {
    throw new Error('Formula contains invalid characters or unknown variables');
  }

  const result = Function(`"use strict"; return (${expression})`)() as number;

  if (typeof result !== 'number' || !Number.isFinite(result)) {
    throw new Error('Formula did not produce a valid number');
  }

  return result;
}

export function validatePricingFormula(formula: string): string | null {
  if (!formula.trim()) {
    return 'Formula is required';
  }

  try {
    const sample = evaluateFormula(formula, {
      silverRate: 600,
      weightGrams: 25,
      stonePrice: 5000,
      quotient: 4,
    });
    if (sample < 0) {
      return 'Formula produced a negative value with sample inputs';
    }
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : 'Invalid formula';
  }
}

export function getQualityQuotient(
  itemQuality: ItemQuality,
  config: PricingConfig = DEFAULT_PRICING_CONFIG
): number {
  return itemQuality === 'PREMIUM' ? config.premiumQuotient : config.localQuotient;
}

export function calculateItemSuggestedPrice(
  input: PricingItemInput,
  config: PricingConfig = DEFAULT_PRICING_CONFIG
): number {
  const quotient = getQualityQuotient(input.itemQuality, config);
  const raw = evaluateFormula(config.formula, {
    silverRate: input.todaySilverRate,
    weightGrams: input.weightGrams,
    stonePrice: input.stonePrice || 0,
    quotient,
  });
  return roundPKR(raw);
}

export function parsePricingConfig(stored: string | null): PricingConfig {
  if (!stored) return DEFAULT_PRICING_CONFIG;

  try {
    const parsed = JSON.parse(stored) as Partial<PricingConfig> & {
      quotientRules?: unknown;
      defaultQuotient?: number;
    };

    if ('quotientRules' in parsed && parsed.quotientRules) {
      return {
        formula:
          parsed.formula?.includes('stonePrice')
            ? parsed.formula
            : DEFAULT_PRICING_CONFIG.formula,
        premiumQuotient: DEFAULT_PRICING_CONFIG.premiumQuotient,
        localQuotient: DEFAULT_PRICING_CONFIG.localQuotient,
      };
    }

    return {
      formula: parsed.formula || DEFAULT_PRICING_CONFIG.formula,
      premiumQuotient:
        Number(parsed.premiumQuotient) || DEFAULT_PRICING_CONFIG.premiumQuotient,
      localQuotient:
        Number(parsed.localQuotient) || DEFAULT_PRICING_CONFIG.localQuotient,
    };
  } catch {
    return DEFAULT_PRICING_CONFIG;
  }
}
