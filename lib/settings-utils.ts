import { prisma } from './prisma';
import {
  PRICING_CONFIG_KEY,
  parsePricingConfig,
  type PricingConfig,
} from './pricing-config';

/**
 * Get a setting value by key
 */
export async function getSetting(key: string): Promise<string | null> {
  try {
    const setting = await prisma.settings.findUnique({
      where: { key },
    });
    return setting?.value || null;
  } catch (error) {
    console.error(`Error getting setting ${key}:`, error);
    return null;
  }
}

/**
 * Set or update a setting value
 */
export async function setSetting(
  key: string,
  value: string,
  description?: string,
  updatedBy?: string
): Promise<void> {
  try {
    await prisma.settings.upsert({
      where: { key },
      update: {
        value,
        description,
        updatedBy,
        updatedAt: new Date(),
      },
      create: {
        key,
        value,
        description,
        updatedBy,
      },
    });
  } catch (error) {
    console.error(`Error setting ${key}:`, error);
    throw error;
  }
}

export async function getPricingConfig(): Promise<PricingConfig> {
  const stored = await getSetting(PRICING_CONFIG_KEY);
  return parsePricingConfig(stored);
}

export async function savePricingConfig(
  config: PricingConfig,
  updatedBy?: string
): Promise<void> {
  await setSetting(
    PRICING_CONFIG_KEY,
    JSON.stringify(config),
    'Sale price formula and quality-based quotient settings',
    updatedBy
  );
}

/**
 * Get shop information
 */
export async function getShopInfo(): Promise<{
  name: string;
  address: string;
  phone: string;
  email: string;
  logo: string | null;
}> {
  const [name, address, phone, email, logo] = await Promise.all([
    getSetting('shop_name'),
    getSetting('shop_address'),
    getSetting('shop_phone'),
    getSetting('shop_email'),
    getSetting('shop_logo'),
  ]);

  return {
    name: name || 'Jewelry Shop',
    address: address || '',
    phone: phone || '',
    email: email || '',
    logo: logo,
  };
}

/**
 * Get all settings as a map
 */
export async function getAllSettings(): Promise<Record<string, string>> {
  try {
    const settings = await prisma.settings.findMany();
    const settingsMap: Record<string, string> = {};
    settings.forEach((setting) => {
      settingsMap[setting.key] = setting.value;
    });
    return settingsMap;
  } catch (error) {
    console.error('Error getting all settings:', error);
    return {};
  }
}

