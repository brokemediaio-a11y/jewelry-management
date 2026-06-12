import { NextRequest } from 'next/server';
import { z } from 'zod';
import { successResponse, errorResponse } from '@/lib/api-response';
import { requireAdmin, requireAuth } from '@/lib/auth';
import { DEFAULT_PRICING_CONFIG, validatePricingFormula } from '@/lib/pricing-config';
import { getPricingConfig, savePricingConfig } from '@/lib/settings-utils';

const quotientRuleSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  keywords: z.array(z.string().min(1)).min(1),
  quotient: z.number().positive('Quotient must be positive'),
});

const pricingConfigSchema = z.object({
  defaultQuotient: z.number().positive('Default quotient must be positive'),
  formula: z.string().min(1, 'Formula is required'),
  quotientRules: z.array(quotientRuleSchema),
});

export async function GET() {
  const auth = await requireAuth();
  if ('error' in auth) {
    return errorResponse(auth.error, auth.status);
  }

  try {
    const config = await getPricingConfig();
    return successResponse(config);
  } catch (error) {
    console.error('Failed to fetch pricing config:', error);
    return errorResponse('Failed to fetch pricing config', 500);
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return errorResponse(auth.error, auth.status);
  }

  try {
    const body = await request.json();
    const data = pricingConfigSchema.parse(body);

    const formulaError = validatePricingFormula(data.formula);
    if (formulaError) {
      return errorResponse(formulaError, 400);
    }

    await savePricingConfig(data, auth.session.id);

    return successResponse(data);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0]?.message || 'Validation error', 400);
    }
    console.error('Failed to save pricing config:', error);
    return errorResponse('Failed to save pricing config', 500);
  }
}

export async function POST() {
  const auth = await requireAdmin();
  if ('error' in auth) {
    return errorResponse(auth.error, auth.status);
  }

  try {
    await savePricingConfig(DEFAULT_PRICING_CONFIG, auth.session.id);
    return successResponse(DEFAULT_PRICING_CONFIG);
  } catch (error) {
    console.error('Failed to reset pricing config:', error);
    return errorResponse('Failed to reset pricing config', 500);
  }
}
