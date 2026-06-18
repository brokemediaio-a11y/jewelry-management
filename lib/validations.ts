import { z } from 'zod';

// Category
export const createCategorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  description: z.string().optional().nullable(),
});

export const updateCategorySchema = createCategorySchema.partial();

// Stones
export const stoneOptionKindSchema = z.enum(['TYPE', 'COLOR', 'CUT', 'CLARITY']);

export const createStoneOptionSchema = z.object({
  kind: stoneOptionKindSchema,
  name: z.string().min(1, 'Name is required').max(100),
});

export const updateStoneOptionSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
});

export const itemQualitySchema = z.enum(['PREMIUM', 'LOCAL']);

const inventoryStoneFieldsSchema = z.object({
  itemQuality: itemQualitySchema,
  hasStoneConfig: z.boolean().default(false),
  stoneTypeId: z.string().uuid().optional().nullable(),
  stoneColorId: z.string().uuid().optional().nullable(),
  stoneCutId: z.string().uuid().optional().nullable(),
  stoneClarityId: z.string().uuid().optional().nullable(),
  stonePrice: z
    .number()
    .nonnegative('Stone price must be non-negative')
    .optional()
    .nullable()
    .or(z.string().transform(Number).optional().nullable()),
});

function validateStoneConfiguration(
  data: z.infer<typeof inventoryStoneFieldsSchema>,
  ctx: z.RefinementCtx
) {
  if (!data.hasStoneConfig) return;

  if (!data.stoneTypeId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Stone type is required',
      path: ['stoneTypeId'],
    });
  }
  if (!data.stoneColorId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Stone color is required',
      path: ['stoneColorId'],
    });
  }
  if (!data.stoneCutId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Stone cut is required',
      path: ['stoneCutId'],
    });
  }
  if (!data.stoneClarityId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Stone clarity is required',
      path: ['stoneClarityId'],
    });
  }
  if (data.stonePrice == null || Number(data.stonePrice) < 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Stone price is required when stone configuration is set',
      path: ['stonePrice'],
    });
  }
}

// Inventory (batch create)
export const createInventorySchema = z
  .object({
    imageData: z.string().min(1, 'Image is required'),
    imageMimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
    categoryId: z.string().uuid('Invalid category ID'),
    weightGrams: z.number().positive('Weight must be positive').or(z.string().transform(Number)),
    silverRateAtPurchase: z
      .number()
      .nonnegative('Silver rate must be non-negative')
      .or(z.string().transform(Number)),
    quantity: z
      .number()
      .int()
      .positive('Quantity must be at least 1')
      .max(100)
      .or(z.string().transform(Number)),
    purchasePricePerGram: z
      .number()
      .nonnegative('Purchase price per gram must be non-negative')
      .or(z.string().transform(Number)),
  })
  .merge(inventoryStoneFieldsSchema)
  .superRefine(validateStoneConfiguration);

export const updateInventorySchema = z
  .object({
    imageData: z.string().min(1).optional(),
    imageMimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']).optional(),
    categoryId: z.string().uuid().optional(),
    weightGrams: z.number().positive().or(z.string().transform(Number)).optional(),
    silverRateAtPurchase: z.number().nonnegative().or(z.string().transform(Number)).optional(),
    purchasePricePerGram: z.number().nonnegative().or(z.string().transform(Number)).optional(),
  })
  .merge(inventoryStoneFieldsSchema.partial())
  .superRefine((data, ctx) => {
    if (data.hasStoneConfig === true) {
      validateStoneConfiguration(
        {
          itemQuality: data.itemQuality ?? 'LOCAL',
          hasStoneConfig: true,
          stoneTypeId: data.stoneTypeId,
          stoneColorId: data.stoneColorId,
          stoneCutId: data.stoneCutId,
          stoneClarityId: data.stoneClarityId,
          stonePrice: data.stonePrice,
        },
        ctx
      );
    }
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

export const createExternalCustomOrderSchema = z.object({
  source: z.literal('EXTERNAL'),
  saleType: z.literal('CUSTOM_ORDER'),
  customerId: z.string().uuid('Invalid customer ID'),
  sampleImageData: z.string().min(1, 'Sample image is required'),
  sampleImageMimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  orderDescription: z.string().min(10, 'Order description must be at least 10 characters'),
  manualCost: z.number().nonnegative().optional().nullable().or(z.string().transform(Number).optional().nullable()),
  finalPrice: z.number().positive().or(z.string().transform(Number)),
  advancePaid: z.number().positive().or(z.string().transform(Number)),
  pickupDate: z.string().min(1, 'Pickup date is required'),
  paymentMethod: z.enum(['CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'CHEQUE']),
  notes: z.string().optional().nullable(),
});

export const createAnySaleSchema = z.union([createSaleSchema, createExternalCustomOrderSchema]);

export const closeSaleSchema = z.object({
  paymentMethod: z.enum(['CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'CHEQUE']).optional(),
});

// Expenses
export const expenseTypeSchema = z.enum(["BEOPARI", "KAREGAR", "SHOP", "HOME"]);

const expenseAllocationSchema = z.object({
  id: z.string().uuid().optional(),
  targetId: z.string().uuid("Invalid target ID"),
  amount: z.number().positive().or(z.string().transform(Number)),
});

export const createExpenseSchema = z
  .object({
    expenseType: expenseTypeSchema,
    amount: z.number().positive().or(z.string().transform(Number)),
    expenseDate: z.string().optional(),
    paymentMethod: z.enum(["CASH", "CARD", "UPI", "BANK_TRANSFER", "CHEQUE"]).default("CASH"),
    description: z.string().optional().nullable(),
    beopariId: z.string().uuid().optional().nullable(),
    karegarId: z.string().uuid().optional().nullable(),
    allocations: z.array(expenseAllocationSchema).optional().default([]),
  })
  .superRefine((data, ctx) => {
    const desc = (data.description || "").trim();
    if (data.expenseType === "SHOP" || data.expenseType === "HOME") {
      if (desc.length < 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Description is required (min 10 characters)",
          path: ["description"],
        });
      }
    }

    if (data.expenseType === "BEOPARI") {
      if (!data.beopariId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Beopari is required",
          path: ["beopariId"],
        });
      }
      if (!data.allocations.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Select at least one purchase to allocate payment",
          path: ["allocations"],
        });
      }
    }

    if (data.expenseType === "KAREGAR") {
      if (!data.karegarId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Karegar is required",
          path: ["karegarId"],
        });
      }
      if (!data.allocations.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Select at least one workshop order to allocate payment",
          path: ["allocations"],
        });
      }
    }

    if (data.expenseType === "BEOPARI" || data.expenseType === "KAREGAR") {
      const sum = data.allocations.reduce((acc, a) => acc + Number(a.amount || 0), 0);
      if (Math.abs(sum - Number(data.amount)) > 0.009) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Allocations total must equal expense amount",
          path: ["allocations"],
        });
      }
    }
  });

export const updateExpenseSchema = createExpenseSchema.partial();

// Auth
export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

export const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'STAFF', 'CLERK', 'ACCOUNTANT', 'WORKER']).default('STAFF'),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['ADMIN', 'STAFF', 'CLERK', 'ACCOUNTANT', 'WORKER']).optional(),
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
