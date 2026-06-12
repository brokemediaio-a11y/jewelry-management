import { z } from 'zod';

// Category
export const createCategorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().optional().nullable(),
});

export const updateCategorySchema = createCategorySchema.partial();

// Inventory (batch create)
export const createInventorySchema = z.object({
  imageData: z.string().min(1, 'Image is required'),
  imageMimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  categoryId: z.string().uuid('Invalid category ID'),
  weightGrams: z.number().positive('Weight must be positive').or(z.string().transform(Number)),
  silverRateAtPurchase: z.number().nonnegative('Silver rate must be non-negative').or(z.string().transform(Number)),
  hasStone: z.boolean().default(false),
  stoneType: z.string().optional().nullable(),
  stoneDetails: z.string().optional().nullable(),
  quantity: z.number().int().positive('Quantity must be at least 1').max(100).or(z.string().transform(Number)),
  purchasePricePerGram: z.number().nonnegative('Purchase price per gram must be non-negative').or(z.string().transform(Number)),
});

export const updateInventorySchema = z.object({
  imageData: z.string().min(1).optional(),
  imageMimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']).optional(),
  categoryId: z.string().uuid().optional(),
  weightGrams: z.number().positive().or(z.string().transform(Number)).optional(),
  silverRateAtPurchase: z.number().nonnegative().or(z.string().transform(Number)).optional(),
  hasStone: z.boolean().optional(),
  stoneType: z.string().optional().nullable(),
  stoneDetails: z.string().optional().nullable(),
  purchasePricePerGram: z.number().nonnegative().or(z.string().transform(Number)).optional(),
});

// Customer
export const createCustomerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  email: z.string().email('Invalid email').optional().nullable(),
});

export const updateCustomerSchema = createCustomerSchema.partial();

// Sale (multi-item)
export const saleItemInputSchema = z.object({
  inventoryItemId: z.string().uuid('Invalid inventory item ID'),
  finalPrice: z.number().positive('Final price must be positive').or(z.string().transform(Number)),
});

export const createSaleSchema = z.object({
  items: z.array(saleItemInputSchema).min(1, 'At least one item is required'),
  saleType: z.enum(['PURCHASE', 'CUSTOM_ORDER']),
  customerId: z.string().uuid('Invalid customer ID'),
  paymentMethod: z.enum(['CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'CHEQUE']),
  notes: z.string().optional().nullable(),
  advancePaid: z.number().nonnegative().optional().nullable().or(z.string().transform(Number).optional().nullable()),
  pickupDate: z.string().optional().nullable(),
});

export const closeSaleSchema = z.object({
  paymentMethod: z.enum(['CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'CHEQUE']).optional(),
});

// Auth
export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

export const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'STAFF', 'CLERK', 'ACCOUNTANT']).default('STAFF'),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['ADMIN', 'STAFF', 'CLERK', 'ACCOUNTANT']).optional(),
});

// Query
export const paginationSchema = z.object({
  page: z
    .union([z.string(), z.number()])
    .transform((val) => (typeof val === 'string' ? Number(val) : val))
    .pipe(z.number().int().positive())
    .default(1),
  limit: z
    .union([z.string(), z.number()])
    .transform((val) => (typeof val === 'string' ? Number(val) : val))
    .pipe(z.number().int().positive().max(100))
    .default(10),
});
