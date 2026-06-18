import { create } from 'zustand';
import { roundPKR } from '@/lib/currency-utils';

export type SilverRateInfo = {
  ratePerGram: number;
  currency: string;
  fetchedAt: string;
  fromCache: boolean;
  isSessionOverride: boolean;
  lockedUntil: string | null;
};

type SilverRateState = {
  rate: SilverRateInfo | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  fetchRate: () => Promise<void>;
  saveRate: (ratePerGram: number) => Promise<boolean>;
};

export const useSilverRateStore = create<SilverRateState>((set, get) => ({
  rate: null,
  loading: false,
  saving: false,
  error: null,

  fetchRate: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch('/api/silver-rates/current');
      const data = await res.json();
      if (data.success) {
        set({ rate: data.data as SilverRateInfo });
      } else {
        set({ error: data.error || 'Failed to load silver rate' });
      }
    } catch {
      set({ error: 'Failed to load silver rate' });
    } finally {
      set({ loading: false });
    }
  },

  saveRate: async (ratePerGram: number) => {
    const value = roundPKR(ratePerGram);
    if (!Number.isFinite(value) || value <= 0) {
      set({ error: 'Silver rate must be a positive number' });
      return false;
    }

    set({ saving: true, error: null });
    try {
      const res = await fetch('/api/silver-rates/session', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ratePerGram: value }),
      });
      const data = await res.json();
      if (!data.success) {
        set({ error: data.error || 'Failed to save silver rate' });
        return false;
      }
      set({ rate: data.data as SilverRateInfo });
      return true;
    } catch {
      set({ error: 'Failed to save silver rate' });
      return false;
    } finally {
      set({ saving: false });
    }
  },
}));

export function useEffectiveSilverRate(): number {
  return useSilverRateStore((s) => s.rate?.ratePerGram ?? 0);
}
