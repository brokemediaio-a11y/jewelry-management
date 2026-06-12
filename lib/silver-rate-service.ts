import { Prisma } from '@prisma/client';
import { prisma } from './prisma';

const CACHE_TTL_MS = 5 * 60 * 1000;
const DEFAULT_CURRENCY = 'PKR';

function getApiKey(): string {
  return process.env.GOLDPRICEZ_API_KEY || process.env.silver_api_key || '';
}

function getCurrency(): string {
  return process.env.SILVER_RATE_CURRENCY || DEFAULT_CURRENCY;
}

function extractSilverRate(data: Record<string, unknown>, currency: string): number | null {
  const key = `silver_gram_in_${currency.toLowerCase()}`;
  const value = data[key];
  if (value === undefined || value === null) return null;
  const parsed = Number.parseFloat(String(value));
  return Number.isFinite(parsed) ? parsed : null;
}

async function getLatestCachedRate(currency: string) {
  return prisma.silverRateCache.findFirst({
    where: { currency },
    orderBy: { fetchedAt: 'desc' },
  });
}

export async function fetchAndCacheSilverRate(): Promise<number> {
  const apiKey = getApiKey();
  const currency = getCurrency();

  if (!apiKey) {
    throw new Error('Silver API key is not configured');
  }

  const endpoint = `https://goldpricez.com/api/rates/currency/${currency.toLowerCase()}/measure/gram/metal/all`;

  const response = await fetch(endpoint, {
    headers: {
      'X-API-KEY': apiKey,
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    const cached = await getLatestCachedRate(currency);
    if (cached) {
      return Number.parseFloat(cached.ratePerGram.toString());
    }
    throw new Error(`Silver rate API error: ${response.status}`);
  }

  let data = (await response.json()) as Record<string, unknown> | string;
  if (typeof data === 'string') {
    data = JSON.parse(data) as Record<string, unknown>;
  }
  const rate = extractSilverRate(data, currency);

  if (rate === null) {
    const cached = await getLatestCachedRate(currency);
    if (cached) {
      return Number.parseFloat(cached.ratePerGram.toString());
    }
    throw new Error(`Silver rate field not found for currency ${currency}`);
  }

  await prisma.silverRateCache.create({
    data: {
      currency,
      ratePerGram: new Prisma.Decimal(rate),
      source: 'goldpricez',
      rawResponse: data as Prisma.InputJsonValue,
    },
  });

  return rate;
}

export async function getCurrentSilverRate(): Promise<{
  ratePerGram: number;
  currency: string;
  fetchedAt: Date;
  fromCache: boolean;
}> {
  const currency = getCurrency();
  const cached = await getLatestCachedRate(currency);

  if (cached) {
    const ageMs = Date.now() - cached.fetchedAt.getTime();
    if (ageMs < CACHE_TTL_MS) {
      return {
        ratePerGram: Number.parseFloat(cached.ratePerGram.toString()),
        currency: cached.currency,
        fetchedAt: cached.fetchedAt,
        fromCache: true,
      };
    }
  }

  const rate = await fetchAndCacheSilverRate();
  const latest = await getLatestCachedRate(currency);

  return {
    ratePerGram: rate,
    currency,
    fetchedAt: latest?.fetchedAt || new Date(),
    fromCache: false,
  };
}
