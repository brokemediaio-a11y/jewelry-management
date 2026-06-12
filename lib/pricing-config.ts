import { roundPKR } from '@/lib/currency-utils';

export interface PricingItemInput {
  todaySilverRate: number;
  weightGrams: number;
  purchasePricePerPiece: number;
  categoryName: string;
}

export const PRICING_CONFIG_KEY = 'pricing_config';

export interface QuotientRule {
  id: string;
  label: string;
  keywords: string[];
  quotient: number;
}

export interface PricingConfig {
  defaultQuotient: number;
  formula: string;
  quotientRules: QuotientRule[];
}

export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  defaultQuotient: 2,
  formula: '((silverRate * weightGrams) + purchasePricePerPiece) * quotient',
  quotientRules: [
    {
      id: 'real_premium',
      label: 'Real Premium',
      keywords: ['real_premium'],
      quotient: 4,
    },
    {
      id: 'real',
      label: 'Real',
      keywords: ['real'],
      quotient: 3,
    },
    {
      id: 'zircon_onix',
      label: 'Zircon / Onix / Onyx',
      keywords: ['zircon', 'onix', 'onyx'],
      quotient: 2,
    },
  ],
};

const FORMULA_VARIABLES = [
  'silverRate',
  'weightGrams',
  'purchasePricePerPiece',
  'quotient',
] as const;

function normalizeCategoryName(categoryName: string): string {
  return categoryName.toLowerCase().replace(/\s+/g, '_');
}

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
      purchasePricePerPiece: 5000,
      quotient: 2,
    });
    if (sample < 0) {
      return 'Formula produced a negative value with sample inputs';
    }
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : 'Invalid formula';
  }
}

export function getCategoryQuotient(
  categoryName: string,
  config: PricingConfig = DEFAULT_PRICING_CONFIG
): number {
  const name = normalizeCategoryName(categoryName);

  for (const rule of config.quotientRules) {
    for (const keyword of rule.keywords) {
      const normalizedKeyword = keyword.toLowerCase().replace(/\s+/g, '_');
      if (name.includes(normalizedKeyword)) {
        return rule.quotient;
      }
    }
  }

  return config.defaultQuotient;
}

export function calculateItemSuggestedPrice(
  input: PricingItemInput,
  config: PricingConfig = DEFAULT_PRICING_CONFIG
): number {
  const quotient = getCategoryQuotient(input.categoryName, config);
  const raw = evaluateFormula(config.formula, {
    silverRate: input.todaySilverRate,
    weightGrams: input.weightGrams,
    purchasePricePerPiece: input.purchasePricePerPiece,
    quotient,
  });
  return roundPKR(raw);
}

export function parsePricingConfig(stored: string | null): PricingConfig {
  if (!stored) return DEFAULT_PRICING_CONFIG;

  try {
    const parsed = JSON.parse(stored) as PricingConfig;
    return {
      defaultQuotient:
        Number(parsed.defaultQuotient) || DEFAULT_PRICING_CONFIG.defaultQuotient,
      formula: parsed.formula || DEFAULT_PRICING_CONFIG.formula,
      quotientRules: Array.isArray(parsed.quotientRules)
        ? parsed.quotientRules.map((rule, index) => ({
            id: rule.id || `rule_${index}`,
            label: rule.label || '',
            keywords: Array.isArray(rule.keywords) ? rule.keywords : [],
            quotient:
              Number(rule.quotient) || DEFAULT_PRICING_CONFIG.defaultQuotient,
          }))
        : DEFAULT_PRICING_CONFIG.quotientRules,
    };
  } catch {
    return DEFAULT_PRICING_CONFIG;
  }
}
