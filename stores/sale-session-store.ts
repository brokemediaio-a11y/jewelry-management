import { create } from 'zustand';
import { roundPKR } from '@/lib/currency-utils';

export type SaleType = 'PURCHASE' | 'CUSTOM_ORDER';
export type PaymentMethod = 'CASH' | 'CARD' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE';

export interface CartItem {
  inventoryItemId: string;
  sku: string;
  barcode: string;
  imageData: string;
  categoryName: string;
  weightGrams: number;
  itemQuality: 'PREMIUM' | 'LOCAL';
  stoneSummary: string | null;
  stonePrice: number | null;
  silverRateAtPurchase: number;
  purchasePricePerPiece: number;
  qualityQuotient: number;
  suggestedSalePrice: number;
  finalPrice: number;
}

interface SaleSessionState {
  cartItems: CartItem[];
  silverRateAtSale: number;
  customerId: string | null;
  saleType: SaleType;
  advancePaid: number;
  pickupDate: string | null;
  paymentMethod: PaymentMethod;
  notes: string;

  setSilverRateAtSale: (rate: number) => void;
  addToCart: (item: CartItem) => boolean;
  removeFromCart: (inventoryItemId: string) => void;
  clearCart: () => void;
  updateItemFinalPrice: (inventoryItemId: string, finalPrice: number) => void;
  getSuggestedTotal: () => number;
  getFinalTotal: () => number;
  setCustomerId: (customerId: string | null) => void;
  setSaleType: (saleType: SaleType) => void;
  setAdvancePaid: (amount: number) => void;
  setPickupDate: (date: string | null) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setNotes: (notes: string) => void;
  reset: () => void;
}

const initialState = {
  cartItems: [] as CartItem[],
  silverRateAtSale: 0,
  customerId: null as string | null,
  saleType: 'PURCHASE' as SaleType,
  advancePaid: 0,
  pickupDate: null as string | null,
  paymentMethod: 'CASH' as PaymentMethod,
  notes: '',
};

export const useSaleSessionStore = create<SaleSessionState>((set, get) => ({
  ...initialState,

  setSilverRateAtSale: (rate) => set({ silverRateAtSale: rate }),

  addToCart: (item) => {
    const exists = get().cartItems.some(
      (c) => c.inventoryItemId === item.inventoryItemId
    );
    if (exists) return false;
    set({ cartItems: [...get().cartItems, item] });
    return true;
  },

  removeFromCart: (inventoryItemId) =>
    set({
      cartItems: get().cartItems.filter(
        (c) => c.inventoryItemId !== inventoryItemId
      ),
    }),

  clearCart: () => set({ cartItems: [] }),

  updateItemFinalPrice: (inventoryItemId, finalPrice) =>
    set({
      cartItems: get().cartItems.map((c) =>
        c.inventoryItemId === inventoryItemId
          ? { ...c, finalPrice: roundPKR(finalPrice) }
          : c
      ),
    }),

  getSuggestedTotal: () =>
    roundPKR(
      get().cartItems.reduce((sum, c) => sum + c.suggestedSalePrice, 0)
    ),

  getFinalTotal: () =>
    roundPKR(get().cartItems.reduce((sum, c) => sum + c.finalPrice, 0)),

  setCustomerId: (customerId) => set({ customerId }),
  setSaleType: (saleType) => set({ saleType }),
  setAdvancePaid: (amount) => set({ advancePaid: amount }),
  setPickupDate: (date) => set({ pickupDate: date }),
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  setNotes: (notes) => set({ notes }),
  reset: () => set({ ...initialState }),
}));
