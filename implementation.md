# Venus Silver Collection — Implementation Plan

> **Status:** Approved — decisions locked (see §12). See `modules.md` for task tickets.
> **Last updated:** June 11, 2026
> **Next step:** Implement module by module per `modules.md`.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State vs Target State](#2-current-state-vs-target-state)
3. [Target Architecture](#3-target-architecture)
4. [Database Schema Redesign](#4-database-schema-redesign)
5. [External API Integration — GoldPriceZ](#5-external-api-integration--goldpricez)
6. [Business Rules & Formulas](#6-business-rules--formulas)
7. [Module Implementation Plan](#7-module-implementation-plan)
8. [Recommended Implementation Order](#8-recommended-implementation-order)
9. [File & Folder Restructure](#9-file--folder-restructure)
10. [Migration Strategy (Existing Data)](#10-migration-strategy-existing-data)
11. [Environment Variables](#11-environment-variables)
12. [Open Questions for Approval](#12-open-questions-for-approval)
13. [Testing Checklist (Per Module)](#13-testing-checklist-per-module)

---

## 1. Executive Summary

### What the application must do

Venus Silver Collection is a **silver jewelry shop management system** focused on:

1. **Categories** — Manage product categories (Rings, Bracelets, Necklaces, Chains, etc.)
2. **Inventory** — Add products with images, auto-fetch silver rates, auto-generate SKU/barcode, bulk barcode printing
3. **Sales** — Scan barcode or enter SKU → auto-calculate sale price using live silver rate + category quotient → record purchase or custom order sales
4. **Customers** — Select existing or create new customers during sales

### Core business differentiators

- Silver rates are fetched from **GoldPriceZ API** (not manually typed)
- Sale price uses a **category quotient formula** based on keywords in the category name
- Two sale types: **Purchase** (immediate) and **Custom Order** (advance payment + pickup date + close sale later)
- Each inventory item gets a **unique SKU and barcode** (quantity = N creates N separate records)
- **All monetary values in PKR** — silver rates, purchase prices, sale prices, invoices
- **Multi-item sales** — scan/add multiple products to one sale before checkout
- **Product images stored as base64** in PostgreSQL (no filesystem uploads)
- **Authentication required** before sales module is built

### What changes from the current codebase

The existing app is a generic jewelry POS with gold/silver support, manual rates, stub category/customer pages, cart-based sales, and separate product vs inventory flows. The restructure **simplifies to silver-only**, **merges product creation into inventory**, **replaces manual pricing with API-driven formulas**, and **rebuilds the sales flow around barcode/SKU lookup**.

---

## 2. Current State vs Target State

### 2.1 What already exists (reusable)

| Area | Current State | Reuse Strategy |
|------|---------------|----------------|
| **Tech stack** | Next.js 16, React 19, Prisma 7, PostgreSQL, Tailwind, shadcn/ui | Keep |
| **Categories API** | Full CRUD at `/api/categories` | Extend schema, rebuild UI |
| **Customers API** | Full CRUD at `/api/customers` | Keep API, build UI |
| **Products API** | Full CRUD at `/api/products` | Refactor into Inventory API |
| **Sales API** | Full CRUD + invoice generation | Major refactor |
| **SKU generation** | `lib/product-utils.ts` — `generateSKU()`, `getCategoryCode()` | Extend |
| **Barcode generation** | `jsbarcode` in product form (client-side) | Extend for bulk print |
| **Prisma + PostgreSQL** | Connected, migrations applied | New migrations |
| **Dashboard layout** | Sidebar, navbar, responsive shell | Keep, update nav items |
| **Invoice/print** | jsPDF + print CSS on sale detail | Extend for custom orders |
| **Settings** | Key-value store for manual gold/silver rates | Replace with API cache + fallback |
| **Zod validations** | `lib/validations.ts` | Rewrite for new schemas |
| **API response helpers** | `lib/api-response.ts` | Keep |

### 2.2 What exists but must be replaced

| Area | Problem | Action |
|------|---------|--------|
| **Categories UI** | Stub placeholder page | Full rebuild |
| **Customers UI** | Stub placeholder page | Full rebuild |
| **Product form** | Gold/silver, purity, making charge, manual rates | Remove — replaced by Inventory form |
| **Inventory IN/OUT flow** | Separate entries on existing products | Remove — inventory creation = product creation |
| **Sales POS** | Cart, multi-item, manual pricing | Rebuild — scan/SKU → formula → multi-item cart |
| **Sales store (Zustand)** | Cart-based state | Rewrite with new pricing formula + sale types |
| **Manual silver rate (Settings)** | User types rate | Replace with GoldPriceZ API + cache |
| **Dashboard stats** | Hardcoded zeros | Wire to real aggregations (later module) |
| **Auth** | Not implemented, hardcoded userId | Build in Module 5 — **before Sales** |

### 2.3 What does not exist (must be built)

| Feature | Priority |
|---------|----------|
| Image capture + base64 storage in DB | P0 |
| GoldPriceZ API integration + caching (PKR) | P0 |
| Category quotient pricing engine (default quotient = 2) | P0 |
| Barcode scanner (camera/input) | P0 |
| Bulk barcode printing | P0 |
| Custom order workflow (advance, pickup, close sale) | P0 |
| Sale type: Purchase vs Custom Order | P0 |
| Multi-item sale cart | P0 |
| `SilverRateCache` table / cron fetch | P0 |
| Authentication (login, sessions, protected routes) | P0 |
| Pricing engine (`lib/pricing-engine.ts`) | P0 |

---

## 3. Target Architecture

### 3.1 High-level diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (Client)                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │Categories│  │Inventory │  │  Sales   │  │ Barcode Scanner  │ │
│  │   UI     │  │   UI     │  │   UI     │  │  + Print UI      │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬─────────┘ │
└───────┼─────────────┼─────────────┼──────────────────┼───────────┘
        │             │             │                  │
        ▼             ▼             ▼                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Next.js API Routes (/api/*)                    │
│  /categories  /inventory  /sales  /customers  /silver-rates     │
│  /auth        /barcodes                                         │
└───────┬─────────────────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Service Layer (lib/)                        │
│  prisma.ts │ image-utils.ts │ silver-rate-service.ts            │
│  pricing-engine.ts │ sku-generator.ts │ auth.ts                 │
│  validations.ts │ api-response.ts                               │
└───────┬─────────────────────────────────────────────────────────┘
        │
        ├──────────────────────┐
        ▼                      ▼
┌───────────────┐    ┌─────────────────────┐
│  PostgreSQL   │    │  GoldPriceZ API     │
│  (Prisma)     │    │  currency=PKR       │
│  images as    │    │  (server-side only) │
│  base64 in DB │    └─────────────────────┘
└───────────────┘
```

### 3.2 Architectural principles

1. **Server-side API calls only** — GoldPriceZ key never exposed to browser
2. **Cache-first silver rates** — Fetch from API max once per 2–5 minutes; serve from DB cache
3. **Snapshot rates at purchase time** — Inventory stores `silverRateAtPurchase` (editable); sales store `silverRateAtSale`
4. **One inventory record = one physical piece** — Quantity N creates N records, each with unique SKU/barcode
5. **Immutable purchase data** — Once inventory is created, purchase price and purchase-date silver rate are stored and shown in sales
6. **Formula-driven suggested price, per-item discounted price** — System calculates suggested sale price per item; user enters discounted price per item; sale final price = sum of item discounted prices
7. **PKR everywhere** — All rates, prices, invoices, and API cache use PKR
8. **Multi-item sales** — One sale can contain multiple inventory items added via repeated scan/SKU lookup
9. **Images in database** — Product images stored as base64 strings in PostgreSQL, not on filesystem
10. **Auth before sales** — Login/session required before sales module is implemented

### 3.3 Layer responsibilities

| Layer | Responsibility |
|-------|----------------|
| **Pages** (`app/dashboard/*`) | UI composition, form state, user interaction |
| **Components** (`components/*`) | Reusable UI blocks per module |
| **API Routes** (`app/api/*`) | HTTP handling, validation, call services |
| **Services** (`lib/*`) | Business logic, external API, calculations |
| **Prisma** | Data access only — no business logic in routes |

---

## 4. Database Schema Redesign

### 4.1 Enums (new / modified)

```prisma
enum SaleType {
  PURCHASE       // Immediate sale — completed on creation
  CUSTOM_ORDER   // Advance payment — completed via "Close Sale"
}

enum SaleStatus {
  COMPLETED      // Fully paid, sale done
  OPEN           // Custom order — awaiting remaining payment
  CANCELLED      // Optional — for voided orders
}

enum InventoryStatus {
  AVAILABLE      // In stock, not sold
  SOLD           // Sold via purchase or closed custom order
  RESERVED       // Custom order placed, not yet picked up
}
```

**Remove or deprecate:**
- `Material` enum (GOLD) — app is silver-only; remove `GOLD` option
- `InventoryOperationType` (IN/OUT) — replaced by `InventoryStatus`

### 4.2 Category model (modified)

```prisma
model Category {
  id          String   @id @default(uuid())
  name        String   @unique          // e.g. "Rings", "Real Premium Bracelets"
  description String?
  // quotient is NOT stored — derived at runtime from name keywords (see §6.2)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  inventoryItems InventoryItem[]
}
```

**Notes:**
- Category name is the **only input** from the user
- Quotient is computed at sale time by parsing the category name (not a DB field)
- Naming convention matters: e.g. `"Real Premium Rings"` → quotient 4

### 4.3 InventoryItem model (replaces Product)

```prisma
model InventoryItem {
  id                    String          @id @default(uuid())

  // Identification
  sku                   String          @unique
  barcode               String          @unique

  // Classification
  categoryId            String
  category              Category        @relation(...)

  // Media — base64-encoded image stored directly in DB
  imageData             String          @db.Text  // data URI: "data:image/jpeg;base64,..."
  imageMimeType         String          // e.g. "image/jpeg" — for validation & rendering

  // Physical properties
  weightGrams           Decimal         @db.Decimal(10, 3)

  // Stone (optional)
  hasStone              Boolean         @default(false)
  stoneType             String?         // e.g. "Zircon", "Onyx" — free text or enum later
  stoneDetails          String?         // additional notes

  // Pricing at time of inventory creation (purchase)
  silverRateAtPurchase  Decimal         @db.Decimal(10, 2)  // per gram, from API, editable
  purchasePricePerGram  Decimal         @db.Decimal(10, 2)
  purchasePricePerPiece Decimal         @db.Decimal(10, 2)  // = purchasePricePerGram × weightGrams (auto-calc, stored)

  // Status
  status                InventoryStatus @default(AVAILABLE)

  // Metadata
  purchasedAt           DateTime        @default(now())     // date inventory was added
  createdAt             DateTime        @default(now())
  updatedAt             DateTime        @updatedAt

  // Relations
  saleItems             SaleItem[]

  @@index([categoryId])
  @@index([sku])
  @@index([barcode])
  @@index([status])
}
```

**Removed from old Product model:**
- `name` — not required per spec (image + category + SKU identify item); *see Open Questions*
- `material`, `purity`, `makingCharge` — silver-only shop, not needed
- `goldRatePerGram` — not needed
- `details` — replaced by `stoneDetails`
- `inventoryEntries` relation — IN/OUT model removed

### 4.4 SilverRateCache model (new)

```prisma
model SilverRateCache {
  id            String   @id @default(uuid())
  currency      String   @default("PKR")  // fixed to PKR
  ratePerGram   Decimal  @db.Decimal(10, 4)
  source        String   @default("goldpricez")
  fetchedAt     DateTime @default(now())
  rawResponse   Json?    // store full API response for debugging

  @@index([currency, fetchedAt])
}
```

**Purpose:** Avoid hitting GoldPriceZ rate limits (30–60 req/hour). All reads go to cache; background job or on-demand fetch refreshes it.

### 4.5 Sale model (modified)

```prisma
model Sale {
  id                    String        @id @default(uuid())
  invoiceNumber         String?       @unique

  // Type & status
  saleType              SaleType
  status                SaleStatus    @default(COMPLETED)

  // Customer
  customerId            String?
  customer              Customer?     @relation(...)

  // Staff
  userId                String
  user                  User          @relation(...)

  // Pricing (all amounts in PKR)
  suggestedSalePrice    Decimal       @db.Decimal(10, 2)  // sum of all item suggested prices
  finalPrice            Decimal       @db.Decimal(10, 2)  // sum of all item finalPrice values (auto-calculated)
  silverRateAtSale      Decimal       @db.Decimal(10, 2)  // today's PKR silver rate at sale time (shared across items)

  // Custom order fields (null for PURCHASE type)
  advancePaid           Decimal?      @db.Decimal(10, 2)
  remainingAmount       Decimal?      @db.Decimal(10, 2)  // = finalPrice - advancePaid
  pickupDate            DateTime?
  closedAt              DateTime?     // when "Close Sale" was clicked

  // Payment
  paymentMethod         PaymentMethod

  notes                 String?
  createdAt             DateTime      @default(now())
  updatedAt             DateTime      @updatedAt

  items                 SaleItem[]
}
```

### 4.6 SaleItem model (modified)

```prisma
model SaleItem {
  id                      String        @id @default(uuid())
  saleId                  String
  inventoryItemId         String        // was productId
  inventoryItem           InventoryItem @relation(...)

  // Snapshot at sale time (for invoice/history)
  weightGrams             Decimal       @db.Decimal(10, 3)
  silverRateAtPurchase    Decimal       @db.Decimal(10, 2)  // from inventory record
  purchasePricePerPiece   Decimal       @db.Decimal(10, 2)  // from inventory record
  silverRateAtSale        Decimal       @db.Decimal(10, 2)  // today's rate
  categoryQuotient        Decimal       @db.Decimal(4, 2)   // computed at sale
  suggestedSalePrice      Decimal       @db.Decimal(10, 2)  // formula result for this item (PKR)
  finalPrice              Decimal       @db.Decimal(10, 2)  // user-entered discounted price for this item (PKR)

  createdAt               DateTime      @default(now())
}
```

**Notes:**
- Each `SaleItem` = one inventory piece (1:1). A sale can have **multiple** `SaleItem` records.
- Scanning the same barcode twice in one cart session should be blocked (duplicate in cart).
- Items already SOLD or RESERVED cannot be added.
- Per-item `suggestedSalePrice` is computed via formula; user manually enters per-item `finalPrice` (discounted price).
- Sale-level `finalPrice` = **sum of all `SaleItem.finalPrice`** values (auto-calculated, not manually entered).

### 4.7 Customer model (unchanged)

Keep as-is. Fields: `name`, `phone`, `address`, `email`.

### 4.8 Models to remove

| Model | Reason |
|-------|--------|
| `Product` | Replaced by `InventoryItem` |
| `InventoryEntry` | IN/OUT tracking replaced by `InventoryStatus` on `InventoryItem` |

### 4.9 Entity relationship diagram

```
Category ──< InventoryItem ──< SaleItem >── Sale >── Customer
                                    │              │
                                    │              └── User
                                    │
                              (status: AVAILABLE → RESERVED → SOLD)

SilverRateCache (standalone, no relations)
Settings (shop info only — rates removed)
```

---

## 5. External API Integration — GoldPriceZ

### 5.1 API details

| Property | Value |
|----------|-------|
| **Provider** | [GoldPriceZ](https://goldpricez.com/about/api) |
| **Auth** | Header `X-API-KEY: {GOLDPRICEZ_API_KEY}` |
| **Protocol** | HTTPS only |
| **Rate limit** | 30–60 requests/hour |
| **Registration** | https://goldpricez.com/key/registration |

### 5.2 Endpoints to use

**For silver rate at inventory creation and at sale time:**

```
GET https://goldpricez.com/api/rates/currency/pkr/measure/gram/metal/all
Header: X-API-KEY: {GOLDPRICEZ_API_KEY}
```

**Response field used:**
- `silver_gram_in_pkr` — silver rate per gram in PKR

**Approved:** All monetary values throughout the app use **PKR**. The API endpoint is fixed to `currency/pkr`. `SILVER_RATE_CURRENCY` env var defaults to `PKR` and should not be changed.

### 5.3 Server-side service: `lib/silver-rate-service.ts`

```
getCurrentSilverRate()
  → Check SilverRateCache for rate < 5 minutes old
  → If stale: call GoldPriceZ API
  → Upsert SilverRateCache
  → Return ratePerGram

getSilverRateAtDate(date)
  → For historical display: return InventoryItem.silverRateAtPurchase
  → (API does not provide historical — we snapshot at creation)

fetchAndCacheSilverRate()  // called by cron or on-demand
  → HTTP GET with timeout (10s)
  → Handle 401, 403, 429, 5xx with fallback to last cached rate
  → Log errors
```

### 5.4 Caching strategy

| Scenario | Behavior |
|----------|----------|
| Inventory form opens | `GET /api/silver-rates/current` → serves cache or fetches |
| Sales form opens | Same endpoint |
| Cache age < 5 min | Return cached rate |
| Cache age ≥ 5 min | Fetch new rate, update cache |
| API returns 429 | Return last cached rate + show warning in UI |
| No cache + API fails | Block form submission, show error with manual override option |

### 5.5 New API routes

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/silver-rates/current` | Get current silver rate (cached) |
| `POST` | `/api/silver-rates/refresh` | Force refresh (admin only, rate-limited) |

### 5.6 Security

- `GOLDPRICEZ_API_KEY` stored in `.env` — never sent to client
- All GoldPriceZ calls happen in server-side service only
- Optional: Next.js cron route `/api/cron/refresh-silver-rate` for background refresh

---

## 6. Business Rules & Formulas

### 6.1 Inventory creation rules

| Field | Rule |
|-------|------|
| **Image** | Required. First step in form. Max 5MB. Formats: JPG, PNG, WebP. Converted to base64 client-side or server-side, stored in `imageData` column. |
| **Category** | Required. Dropdown populated from `/api/categories`. |
| **Weight (grams)** | Required. Positive decimal, max 3 decimal places. |
| **Silver rate** | Auto-fetched from API on form load. User can edit before save. Stored as `silverRateAtPurchase`. |
| **Stone** | Optional toggle. If enabled: show `stoneType` (text) field. |
| **Quantity** | Required. Integer ≥ 1. Creates N separate `InventoryItem` records. |
| **Purchase price/gram** | Required. User enters manually. |
| **Purchase price/piece** | Auto-calculated: `purchasePricePerGram × weightGrams`. Stored, not editable (display only). |
| **SKU** | Auto-generated per item. Format: `{CAT_CODE}-{YYYYMMDD}-{SEQ}` e.g. `RIN-20260611-0001` |
| **Barcode** | Auto-generated. Value = SKU (CODE128 barcode rendered from SKU). Unique per item. |

**Quantity behavior example:**
- User enters quantity = 3
- System creates 3 `InventoryItem` records
- Each gets unique SKU: `RIN-20260611-0001`, `RIN-20260611-0002`, `RIN-20260611-0003`
- Each gets unique barcode (same pattern, different value)
- All share same image, category, weight, rates, stone info

### 6.2 Category quotient rules

Evaluated at **sale time** by inspecting `category.name` (case-insensitive):

| Priority | Keyword in category name | Quotient |
|----------|--------------------------|----------|
| 1 (highest) | `real_premium` | **4** |
| 2 | `real` (and not matched above) | **3** |
| 3 | `zircon` OR `onix` OR `onyx` | **2** |
| 4 (default) | none of the above | **2** *(approved default)* |

**Matching logic (pseudocode):**

```
function getCategoryQuotient(categoryName: string): number {
  const name = categoryName.toLowerCase().replace(/\s+/g, '_');

  if (name.includes('real_premium')) return 4;
  if (name.includes('real'))          return 3;
  if (name.includes('zircon') ||
      name.includes('onix')  ||
      name.includes('onyx'))          return 2;

  return 2; // APPROVED DEFAULT
}
```

**Important:** Check `real_premium` **before** `real` to avoid false match.

**Example category names and quotients:**

| Category Name | Quotient |
|---------------|----------|
| "Rings" | 2 |
| "Bracelets" | 2 |
| "Real Rings" | 3 |
| "Real Premium Necklaces" | 4 |
| "Zircon Bracelets" | 2 |
| "Onix Chains" | 2 |

### 6.3 Sale price formula

```
suggestedSalePrice = ((todaySilverRatePerGram × weightInGrams) + purchasePricePerPiece) × categoryQuotient
```

Where:
- `todaySilverRatePerGram` = current rate from GoldPriceZ (via cache) at sale time
- `weightInGrams` = from `InventoryItem.weightGrams`
- `purchasePricePerPiece` = from `InventoryItem.purchasePricePerPiece`
- `categoryQuotient` = computed from `InventoryItem.category.name`

**Per-item example (PKR):**
- Weight: 25g
- Today's silver rate: Rs. 350.00/gram
- Purchase price per piece: Rs. 5,000
- Category: "Real Premium Rings" → quotient 4

```
itemSuggestedPrice = ((350.00 × 25) + 5000) × 4
                   = (8,750 + 5,000) × 4
                   = 13,750 × 4
                   = Rs. 55,000
```

**Multi-item sale example:**
- Item A suggested: Rs. 55,000 → user enters discounted price: Rs. 52,000
- Item B suggested: Rs. 12,000 → user enters discounted price: Rs. 11,000
- **Suggested total: Rs. 67,000** (display only)
- **Final total: Rs. 63,000** (auto-sum of item discounted prices)

### 6.4 Final price rule (multi-item)

- Each item shows its own `suggestedSalePrice` (formula output)
- User **manually enters `finalPrice` per item** (discounted price for that item)
- Each cart row has an editable "Final Price" input defaulting to the item's suggested price
- Sale displays **suggested total** = sum of all item suggested prices (read-only)
- Sale displays **final total** = sum of all item `finalPrice` values (auto-calculated, read-only)
- Sale-level `finalPrice` on the `Sale` record = sum of `SaleItem.finalPrice` — used for payment / advance calculations
- Per-item `SaleItem.suggestedSalePrice` and `SaleItem.finalPrice` both stored for invoice breakdown
- No automatic discount — user decides each item's discounted price individually
- All amounts displayed and stored in **PKR** (Rs.)

### 6.5 Sale type rules

#### Purchase sale

| Step | Behavior |
|------|----------|
| User selects sale type | "Purchase" |
| User enters final price per item | Required (one discounted price per cart item) |
| User selects/adds customer | Required |
| On submit | Sale created with `status = COMPLETED`; sale `finalPrice` = sum of item prices |
| Inventory items | All items in sale → `status = SOLD` |
| Invoice | Generated immediately with all items listed |

#### Custom order sale

| Step | Behavior |
|------|----------|
| User selects sale type | "Custom Order" |
| User enters final price per item | Required (one discounted price per cart item) |
| User enters advance paid | Required, must be < sale final total (sum of item prices) |
| Remaining amount | Auto-calculated: `finalPrice - advancePaid` (display only) |
| Pickup date | Required (date picker) |
| User selects/adds customer | Required |
| On submit | Sale created with `status = OPEN` |
| Inventory items | All items in sale → `status = RESERVED` |
| Invoice | Generated with "PARTIAL PAYMENT" watermark/note |

#### Close sale (custom order completion)

| Step | Behavior |
|------|----------|
| Trigger | User clicks "Close Sale" on an OPEN custom order |
| Condition | Sale `status = OPEN` and `saleType = CUSTOM_ORDER` |
| Action | Record remaining payment received |
| Result | `status` → `COMPLETED`, `closedAt` → now |
| Inventory items | All items in sale → `SOLD` |
| Invoice | Updated/regenerated as fully paid |

### 6.6 Multi-item cart rules

| Rule | Detail |
|------|--------|
| Add items | After each successful scan/SKU lookup, item is added to cart. User can scan/add more. |
| Duplicate in cart | Same SKU/barcode cannot be added twice to the same cart session |
| Remove item | User can remove items from cart before submitting |
| Suggested total | Live-updated sum of all cart item suggested prices |
| Minimum items | At least 1 item required to submit sale |
| Mixed categories | Allowed — each item uses its own category quotient |
| Silver rate | Single `silverRateAtSale` (today's PKR rate) applied to all items in the sale |

### 6.7 Barcode scan / SKU lookup rules

| Rule | Detail |
|------|--------|
| Entry methods | (1) Scan barcode via camera, (2) Type SKU manually |
| Lookup | `GET /api/inventory/lookup?sku={sku}` or `?barcode={barcode}` |
| Available only | Only return items with `status = AVAILABLE` |
| Reserved blocked | Items with `status = RESERVED` → show "Reserved for custom order" |
| Sold blocked | Items with `status = SOLD` → show "Already sold" |
| Data returned | Full item + category + all purchase-time data + computed suggested price |
| After lookup | Item added to cart; lookup UI remains available for next scan/SKU |

### 6.8 Image storage rules (base64 in database)

| Rule | Detail |
|------|--------|
| Storage | `InventoryItem.imageData` — full data URI string (`data:image/jpeg;base64,...`) |
| Mime type | Stored separately in `imageMimeType` for validation |
| Max size | 5MB original file before encoding (~6.7MB base64 in DB) |
| Client flow | User selects image → preview shown → on submit, send base64 in JSON body |
| Server validation | Validate mime type, decode and check size, reject if > 5MB |
| List thumbnails | Render via `<img src={imageData} />` directly |
| Quantity = N | All N items share the same `imageData` (same photo for batch) |
| No filesystem | No `public/uploads/` directory, no upload API route |

---

## 7. Module Implementation Plan

---

### Module 0 — Foundation & Infrastructure

**Purpose:** Prepare the codebase for all other modules. No user-facing features.

**Tasks:**

| # | Task | Details |
|---|------|---------|
| 0.1 | Prisma schema migration | Apply all schema changes from §4. Migrate `Product` → `InventoryItem` data if any exists |
| 0.2 | Environment variables | Add `GOLDPRICEZ_API_KEY`, `SILVER_RATE_CURRENCY=PKR`, `AUTH_SECRET` |
| 0.3 | Image utilities | `lib/image-utils.ts` — validate mime/size, base64 encode/decode helpers |
| 0.4 | Silver rate service | `lib/silver-rate-service.ts` — PKR cache logic per §5 |
| 0.5 | Silver rate API | `GET /api/silver-rates/current` — returns rate in PKR |
| 0.6 | Pricing engine | `lib/pricing-engine.ts` — `getCategoryQuotient()` (default=2), `calculateSuggestedSalePrice()`, `calculateSuggestedTotal()` |
| 0.7 | SKU/barcode service | Refactor `lib/product-utils.ts` → `lib/sku-generator.ts` with sequential numbering |
| 0.8 | Seed script | `prisma/seed.ts` — default admin user, sample categories |
| 0.9 | Remove deprecated code | Delete old inventory IN/OUT pages, old product form fields, file upload code |
| 0.10 | Update sidebar nav | Rename "Products" → remove; "Inventory" becomes primary |
| 0.11 | PKR formatting utility | `lib/currency-utils.ts` — `formatPKR(amount)` → `"Rs. 1,250.00"` |

**Deliverables:**
- New DB schema applied (with `imageData` base64 column)
- Silver rate fetch + PKR cache works
- Pricing engine unit-testable (default quotient = 2)
- Image validation utilities ready

---

### Module 1 — Categories

**Purpose:** First user-facing module. Categories must exist before inventory can be added.

**Depends on:** Module 0

#### 1.1 UI — Categories List Page (`/dashboard/categories`)

| Element | Behavior |
|---------|----------|
| Page title | "Categories" |
| Table columns | Name, Description, Item Count, Created Date, Actions |
| Search | Filter by name (client-side or API `?name=`) |
| Add button | Opens create dialog/sheet |
| Edit | Inline or dialog |
| Delete | Confirm dialog; block if category has inventory items |
| Empty state | "No categories yet. Add your first category." |

#### 1.2 UI — Create/Edit Category Form

| Field | Type | Validation |
|-------|------|------------|
| Name | Text input | Required, unique, 2–100 chars |
| Description | Textarea | Optional |

**No quotient field** — quotient is derived from name at sale time.

#### 1.3 API (already exists — minor updates)

| Method | Path | Changes |
|--------|------|---------|
| `GET` | `/api/categories` | Add `inventoryCount` in response |
| `POST` | `/api/categories` | No change |
| `PUT` | `/api/categories/[id]` | No change |
| `DELETE` | `/api/categories/[id]` | Block if `inventoryItems.length > 0` |

#### 1.4 Suggested seed categories

```
Rings
Bracelets
Necklaces
Chains
Real Rings
Real Premium Necklaces
Zircon Bracelets
Onix Chains
```

#### 1.5 Files to create/modify

| Action | File |
|--------|------|
| Create | `components/categories/category-form.tsx` |
| Create | `components/categories/category-table.tsx` |
| Create | `components/categories/delete-category-dialog.tsx` |
| Modify | `app/dashboard/categories/page.tsx` |
| Modify | `app/api/categories/route.ts` |
| Modify | `app/api/categories/[id]/route.ts` |

---

### Module 2 — Inventory (Product Creation)

**Purpose:** Core module. Add jewelry pieces to stock with images, rates, SKU, barcode.

**Depends on:** Module 0, Module 1

#### 2.1 UI — Inventory List Page (`/dashboard/inventory`)

| Element | Behavior |
|---------|----------|
| Table columns | Image (thumbnail), SKU, Barcode, Category, Weight, Purchase Price/Piece, Silver Rate (at purchase), Status, Date Added, Actions |
| Filters | Category, Status (Available/Sold/Reserved), Date range |
| Search | By SKU or barcode |
| Actions per row | View, Print Barcode |
| Bulk action | "Print All Barcodes" button |
| Add button | → `/dashboard/inventory/new` |

#### 2.2 UI — Add Inventory Page (`/dashboard/inventory/new`)

**Multi-step or single-page form. Recommended: single page with clear sections.**

**Form field order (exactly as specified):**

| Step | Field | Type | Details |
|------|-------|------|---------|
| 1 | **Product Image** | Image picker (drag & drop + click) | Required. Preview shown immediately. Converted to base64 in browser before submit. Stored in DB. |
| 2 | **Category** | Dropdown | Required. Populated from `GET /api/categories` |
| 3 | **Weight** | Number input (grams) | Required. Decimal allowed (e.g. 25.500) |
| 4 | **Silver Rate** | Number input (per gram) | Auto-filled from `GET /api/silver-rates/current` on page load. **Editable.** Label shows "Silver rate on {today's date}" |
| 5 | **Stone** | Toggle (Yes/No) | Optional. If Yes → show `Stone Type` text field |
| 6 | **Quantity** | Number input (integer) | Required. Min 1. Helper text: "Creates N separate items, each with unique SKU and barcode" |
| 7 | **Purchase Price per Gram** | Number input | Required. Displayed/formatted in PKR (Rs.) |
| 8 | **Purchase Price per Piece** | Display only (calculated) | Auto: `purchasePricePerGram × weight`. Updates live as weight or price/gram changes |
| — | **SKU Preview** | Display only | Shows pattern for first item; final SKUs assigned on save |
| — | **Barcode Preview** | Display only | CODE128 preview of first SKU |
| — | **Submit** | Button | "Add to Inventory" |

**On submit:**
1. Validate all fields
2. Generate N SKUs sequentially
3. Create N `InventoryItem` records in a transaction
4. Redirect to inventory list with success toast showing N items created

#### 2.3 UI — Inventory Detail Page (`/dashboard/inventory/[id]`)

| Section | Content |
|---------|---------|
| Image | Full-size product image |
| Details | SKU, Barcode, Category, Weight, Stone info |
| Purchase info | Silver rate at purchase, purchase price/gram, purchase price/piece, date added |
| Status | Badge: Available / Sold / Reserved |
| Barcode | Rendered barcode image + Print button |
| Sale history | If sold — link to sale record |

#### 2.4 API — Inventory Routes (new, replaces `/api/products`)

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/inventory` | List with filters, pagination |
| `POST` | `/api/inventory` | Create N items (accepts quantity) |
| `GET` | `/api/inventory/[id]` | Single item detail |
| `PUT` | `/api/inventory/[id]` | Update (only if status = AVAILABLE) |
| `DELETE` | `/api/inventory/[id]` | Soft delete or hard delete if never sold |
| `GET` | `/api/inventory/lookup` | Lookup by `?sku=` or `?barcode=` (for sales) |

**POST /api/inventory request body:**

```json
{
  "imageData": "data:image/jpeg;base64,/9j/4AAQ...",
  "imageMimeType": "image/jpeg",
  "categoryId": "uuid",
  "weightGrams": 25.5,
  "silverRateAtPurchase": 350.00,
  "hasStone": true,
  "stoneType": "Zircon",
  "stoneDetails": null,
  "quantity": 3,
  "purchasePricePerGram": 200.00
}
```

**POST /api/inventory response:**

```json
{
  "success": true,
  "data": {
    "created": 3,
    "items": [
      { "id": "...", "sku": "RIN-20260611-0001", "barcode": "RIN-20260611-0001" },
      { "id": "...", "sku": "RIN-20260611-0002", "barcode": "RIN-20260611-0002" },
      { "id": "...", "sku": "RIN-20260611-0003", "barcode": "RIN-20260611-0003" }
    ]
  }
}
```

#### 2.5 SKU generation rules (updated)

```
Format: {CAT_CODE}-{YYYYMMDD}-{SEQUENCE}

CAT_CODE  = first 3 chars of category name (uppercase, alphanumeric only)
YYYYMMDD  = today's date
SEQUENCE  = 4-digit zero-padded daily counter per category

Example: RIN-20260611-0001, RIN-20260611-0002, ...
```

**Uniqueness:** Check DB before assigning; increment sequence if collision.

#### 2.6 Files to create/modify

| Action | File |
|--------|------|
| Create | `app/api/inventory/route.ts` (rewrite) |
| Create | `app/api/inventory/[id]/route.ts` (rewrite) |
| Create | `app/api/inventory/lookup/route.ts` |
| Create | `components/inventory/inventory-form.tsx` |
| Create | `components/inventory/inventory-table.tsx` |
| Create | `components/inventory/image-picker.tsx` |
| Create | `components/inventory/inventory-detail.tsx` |
| Create | `lib/image-utils.ts` |
| Create | `lib/sku-generator.ts` |
| Modify | `app/dashboard/inventory/page.tsx` |
| Modify | `app/dashboard/inventory/new/page.tsx` |
| Create | `app/dashboard/inventory/[id]/page.tsx` |
| Delete | `app/dashboard/products/**` (entire folder) |
| Delete | `app/api/products/**` |
| Delete | `components/products/**` |

---

### Module 3 — Barcode Printing

**Purpose:** Print barcodes for individual items or bulk print all available inventory.

**Depends on:** Module 2

#### 3.1 Single item print

- From inventory detail page or list row action
- Opens print-friendly page: `/dashboard/inventory/[id]/barcode`
- Shows: product image (small), SKU text, CODE128 barcode, category, weight
- Uses `window.print()` with dedicated `barcode-print.css`

#### 3.2 Bulk print all barcodes

- Button on inventory list: "Print All Barcodes"
- Opens `/dashboard/inventory/print-barcodes`
- Query param filters: `?status=AVAILABLE` (default)
- Layout: grid of barcode labels (configurable: 2×4, 3×5 per page)
- Each label: barcode image + SKU text below
- Print via `window.print()`

#### 3.3 Barcode rendering

- Library: `jsbarcode` (already installed)
- Format: CODE128
- Value: SKU string
- Generated client-side for print pages
- Optionally pre-generate and cache barcode PNG server-side (future optimization)

#### 3.4 Files to create

| File | Purpose |
|------|---------|
| `components/inventory/barcode-label.tsx` | Single barcode label component |
| `components/inventory/barcode-print-layout.tsx` | Grid layout for bulk print |
| `app/dashboard/inventory/[id]/barcode/page.tsx` | Single print page |
| `app/dashboard/inventory/print-barcodes/page.tsx` | Bulk print page |
| `app/dashboard/inventory/barcode-print.css` | Print stylesheet |

---

### Module 4 — Customers

**Purpose:** Manage customer database. Required before sales module.

**Depends on:** Module 0

#### 4.1 UI — Customers List (`/dashboard/customers`)

| Element | Behavior |
|---------|----------|
| Table | Name, Phone, Email, Total Sales, Actions |
| Search | By name, phone, email |
| Add button | Opens create dialog |
| Edit/Delete | Standard CRUD |

#### 4.2 UI — Customer Form (dialog)

| Field | Validation |
|-------|------------|
| Name | Required |
| Phone | Optional, unique if provided |
| Email | Optional, valid email |
| Address | Optional |

#### 4.3 API

Keep existing `/api/customers` routes — no changes needed.

#### 4.4 Files to create/modify

| Action | File |
|--------|------|
| Create | `components/customers/customer-form.tsx` |
| Create | `components/customers/customer-table.tsx` |
| Modify | `app/dashboard/customers/page.tsx` |

---

### Module 5 — Authentication

**Purpose:** Secure the application. **Must be completed before Sales module.**

**Depends on:** Module 0

| Feature | Detail |
|---------|--------|
| Login page | `/login` — email + password form |
| Session management | NextAuth.js v5 (Auth.js) or custom JWT with HTTP-only cookies |
| Protected routes | `middleware.ts` — redirect unauthenticated users from `/dashboard/*` to `/login` |
| User context | `useSession()` / server `getSession()` — provides real `userId` for sales |
| Logout | Clear session, redirect to login |
| Password | bcrypt hashing (already in users API) |
| Seed admin | Default admin from seed script used for initial login |
| User roles | ADMIN, STAFF, CLERK, ACCOUNTANT — role-based access (admin-only: settings, user mgmt) |

#### 5.1 API routes

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/auth/login` | Authenticate, return session |
| `POST` | `/api/auth/logout` | Destroy session |
| `GET` | `/api/auth/me` | Current user info |

#### 5.2 Files to create/modify

| Action | File |
|--------|------|
| Create | `app/login/page.tsx` |
| Create | `middleware.ts` |
| Create | `lib/auth.ts` |
| Create | `app/api/auth/login/route.ts` |
| Create | `app/api/auth/logout/route.ts` |
| Create | `app/api/auth/me/route.ts` |
| Modify | `app/dashboard/layout.tsx` — add session check, show logged-in user in navbar |
| Modify | `components/dashboard/navbar.tsx` — user menu + logout |

---

### Module 6 — Sales

**Purpose:** Core revenue module. Scan/lookup → add to cart → price → customer → record sale. Supports **multiple items per sale**.

**Depends on:** Module 0, 1, 2, 3, 4, **5 (Auth)**

#### 6.1 UI — Sales List (`/dashboard/sales`)

| Element | Behavior |
|---------|----------|
| Table columns | Invoice #, Date, Customer, Items Count, Sale Type, Status, Final Price (PKR), Actions |
| Filters | Sale type, Status, Date range, Customer |
| Status badges | COMPLETED (green), OPEN (yellow), CANCELLED (red) |
| Actions | View, Close Sale (if OPEN custom order) |
| New Sale button | → `/dashboard/sales/new` |

#### 6.2 UI — New Sale Page (`/dashboard/sales/new`)

**Layout: two-panel — lookup on top, cart below**

```
┌──────────────────────────────────────────────────────────┐
│  New Sale                                                 │
│  ┌──────────────────┐  ┌──────────────────┐              │
│  │  📷 Scan Barcode │  │  ⌨️ Enter SKU     │              │
│  └──────────────────┘  └──────────────────┘              │
│  [Camera view or SKU input field]                         │
├──────────────────────────────────────────────────────────┤
│  CART (0 items)                          [Clear Cart]    │
│  ┌────────────────────────────────────────────────────┐  │
│  │ [img] SKU-001  Rings  25g  Suggested: Rs.12,000     │  │
│  │       Final Price: [________]  ← per item (editable) │  │
│  │                                        [Remove]     │  │
│  ├────────────────────────────────────────────────────┤  │
│  │ [img] SKU-002  Chain  40g  Suggested: Rs.55,000     │  │
│  │       Final Price: [________]  ← per item (editable) │  │
│  │                                        [Remove]     │  │
│  └────────────────────────────────────────────────────┘  │
│  Suggested Total: Rs. 67,000  (read-only)                 │
│  Final Total:     Rs. 63,000  (auto-sum of item prices)  │
├──────────────────────────────────────────────────────────┤
│  Customer: [dropdown ▼]  [+ Add New]                     │
│  Sale Type: [Purchase ▼]                                 │
│  Payment Method: [Cash ▼]                                │
│  [Custom Order fields if selected]                         │
│                              [Complete Sale]              │
└──────────────────────────────────────────────────────────┘
```

**Phase 1 — Product Lookup (always visible at top):**

| Method | Implementation |
|--------|----------------|
| Scan barcode | `html5-qrcode` or `@zxing/browser` — camera scanner |
| Enter SKU | Text input; USB barcode scanners type into this field |
| On success | Call `GET /api/inventory/lookup?sku=` or `?barcode=` |
| On success | Show brief item preview, then **add to cart** automatically |
| On success | Clear lookup field, ready for next scan |
| Duplicate | Block if same `inventoryItemId` already in cart |
| Unavailable | Show error if SOLD or RESERVED |

**Phase 2 — Cart item card (per item, expandable):**

| Field | Source |
|-------|--------|
| Product image | `InventoryItem.imageData` (base64) |
| SKU / Barcode | From inventory item |
| Category | `Category.name` |
| Weight | `InventoryItem.weightGrams` g |
| Stone | `InventoryItem.stoneType` or "None" |
| Silver rate at purchase | `InventoryItem.silverRateAtPurchase` Rs./gram + purchase date |
| Purchase price per piece | `InventoryItem.purchasePricePerPiece` (PKR) |
| Today's silver rate | `GET /api/silver-rates/current` (PKR, shared for sale) |
| Category quotient | Computed (e.g. "×4 — Real Premium") |
| **Item suggested price** | Formula result for this item (PKR) |
| **Item final price** | Number input (PKR) | User-entered discounted price for this item; defaults to suggested price |

**Phase 3 — Sale totals & checkout (below cart):**

| Field | Type | Details |
|-------|------|---------|
| Suggested total | Display (read-only) | Sum of all cart item suggested prices (PKR) |
| **Final total** | Display (read-only) | Auto-sum of all per-item final prices (PKR) |
| Customer | Searchable dropdown + "Add New" | Required |
| Sale type | Dropdown | "Purchase" or "Custom Order" |
| Payment method | Dropdown | Cash, Card, UPI, Bank Transfer, Cheque |

**Phase 3b — Custom Order fields (when sale type = Custom Order):**

| Field | Type | Details |
|-------|------|---------|
| Advance paid (PKR) | Number input | Required. > 0 and < finalPrice |
| Remaining amount | Display (auto) | `finalPrice - advancePaid` (PKR) |
| Pickup date | Date picker | Required |

**Phase 4 — Submit:**

| Sale Type | On Submit |
|-----------|-----------|
| Purchase | Sale COMPLETED, all cart items → SOLD, redirect to invoice |
| Custom Order | Sale OPEN, all cart items → RESERVED, redirect to invoice |

#### 6.3 UI — Sale Detail / Invoice (`/dashboard/sales/[id]`)

| Section | Content |
|---------|---------|
| Invoice header | Shop info, invoice number, date — all amounts in PKR |
| Customer info | Name, phone, address |
| **Items table** | One row per item: image, SKU, category, weight, stone, silver@purchase, quotient, suggested price, **final price** |
| Pricing summary | Suggested total, **final total (PKR)**, silver rate at sale |
| Custom order section | Advance paid, remaining, pickup date, status |
| Close Sale button | Visible only on OPEN custom orders |
| Actions | Print invoice, Download PDF |

#### 6.4 UI — Close Sale flow

1. User opens OPEN custom order sale detail
2. Clicks "Close Sale" button
3. Confirmation: "Record remaining payment of Rs. {remainingAmount}?"
4. Optional: payment method for remaining amount
5. `POST /api/sales/[id]/close`
6. Sale → COMPLETED, all items → SOLD
7. Invoice updated

#### 6.5 API — Sales Routes (major refactor)

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/sales` | List with filters (saleType, status, date, customer) |
| `POST` | `/api/sales` | Create multi-item sale |
| `GET` | `/api/sales/[id]` | Sale detail with per-item pricing breakdown |
| `POST` | `/api/sales/[id]/close` | Close custom order sale |
| `DELETE` | `/api/sales/[id]` | Cancel sale (revert all items to AVAILABLE) |

**POST /api/sales request body (multi-item):**

```json
{
  "items": [
    { "inventoryItemId": "uuid-1", "finalPrice": 52000.00 },
    { "inventoryItemId": "uuid-2", "finalPrice": 11000.00 }
  ],
  "saleType": "PURCHASE",
  "customerId": "uuid",
  "paymentMethod": "CASH",
  "notes": null,
  "advancePaid": null,
  "pickupDate": null
}
```

> Sale-level `finalPrice` is **not sent** in the request — server computes it as `sum(items[].finalPrice)`.

**POST /api/sales response includes:**
- Per-item `suggestedSalePrice`, `finalPrice`, `categoryQuotient`, pricing snapshots
- Sale-level `suggestedSalePrice` (sum), `finalPrice` (sum of item final prices), `silverRateAtSale` (PKR)
- `invoiceNumber`
- Authenticated `userId` from session (not hardcoded)

**Server-side sale creation logic:**

```
1. Authenticate user (session required)
2. Validate items array (min 1 item)
3. Fetch all InventoryItems (must all be AVAILABLE)
4. Fetch current PKR silver rate from cache
5. For each item:
   a. Compute categoryQuotient from category.name
   b. Compute item suggestedSalePrice via pricing engine
   c. Create SaleItem with full pricing snapshot
6. Compute sale suggestedSalePrice = sum of item suggested prices
7. Validate each item finalPrice > 0; compute sale finalPrice = sum of item finalPrices
8. If CUSTOM_ORDER: validate advancePaid, pickupDate, advancePaid < sale finalPrice
9. Create Sale + all SaleItems in a single DB transaction
10. Update all InventoryItem statuses (SOLD or RESERVED)
11. Generate invoice number
12. Return complete sale with items
```

#### 6.6 State management — `stores/sale-session-store.ts`

Rewrite of cart store with new pricing model:

```typescript
interface CartItem {
  inventoryItemId: string;
  sku: string;
  barcode: string;
  imageData: string;
  categoryName: string;
  weightGrams: number;
  stoneType: string | null;
  silverRateAtPurchase: number;
  purchasePricePerPiece: number;
  categoryQuotient: number;
  suggestedSalePrice: number;  // per item, PKR (formula)
  finalPrice: number;          // per item, PKR (user-entered discounted price)
}

interface SaleSessionStore {
  cartItems: CartItem[];
  silverRateAtSale: number;       // today's PKR rate (fetched once)
  suggestedTotal: number;         // sum of cart item suggested prices (read-only)
  finalTotal: number;             // sum of cart item finalPrice values (auto-calculated)
  customerId: string | null;
  saleType: 'PURCHASE' | 'CUSTOM_ORDER';
  advancePaid: number;
  pickupDate: string | null;
  paymentMethod: PaymentMethod;
  notes: string;

  addToCart: (item: CartItem) => void;
  removeFromCart: (inventoryItemId: string) => void;
  clearCart: () => void;
  updateItemFinalPrice: (inventoryItemId: string, finalPrice: number) => void;
  getSuggestedTotal: () => number;
  getFinalTotal: () => number;
  reset: () => void;
}
```

#### 6.7 Files to create/modify

| Action | File |
|--------|------|
| Create | `components/sales/barcode-scanner.tsx` |
| Create | `components/sales/sku-input.tsx` |
| Create | `components/sales/cart-item-card.tsx` |
| Create | `components/sales/sale-cart.tsx` |
| Create | `components/sales/pricing-panel.tsx` |
| Create | `components/sales/sale-type-selector.tsx` |
| Create | `components/sales/custom-order-fields.tsx` |
| Create | `components/sales/close-sale-dialog.tsx` |
| Rewrite | `app/dashboard/sales/new/page.tsx` |
| Rewrite | `app/dashboard/sales/[id]/page.tsx` |
| Rewrite | `app/dashboard/sales/page.tsx` |
| Rewrite | `app/api/sales/route.ts` |
| Rewrite | `app/api/sales/[id]/route.ts` |
| Create | `app/api/sales/[id]/close/route.ts` |
| Rewrite | `stores/sale-session-store.ts` |
| Delete | `stores/sales-store.ts` |
| Delete | `components/sales/cart.tsx` (old) |
| Delete | `components/sales/product-search.tsx` |
| Delete | `app/api/sales/calculate/route.ts` |

---

### Module 7 — Dashboard & Reporting

**Purpose:** Live stats and overview. Lower priority but useful.

**Depends on:** Modules 1–5

| Widget | Data Source |
|--------|-------------|
| Total inventory (available) | `COUNT inventory WHERE status = AVAILABLE` |
| Total sales (this month) | `COUNT sales WHERE createdAt >= month start` |
| Revenue (this month) | `SUM finalPrice WHERE status = COMPLETED` |
| Open custom orders | `COUNT sales WHERE status = OPEN` |
| Recent sales | Last 5 sales with customer name |
| Low stock | Categories with 0 available items (optional) |

---

### Module 8 — Settings (Simplified)

**Purpose:** Shop info only. Silver rates managed by API.

**Depends on:** Module 0

| Setting | Source |
|---------|--------|
| Shop name, address, phone, email, logo | Manual (keep existing) |
| Silver rate | Read-only display from cache + "Refresh" button |
| Gold rate | **Remove** — silver-only shop |

---

---

## 8. Recommended Implementation Order

```
Module 0: Foundation
    ↓
Module 1: Categories          ← MUST be first (inventory depends on it)
    ↓
Module 2: Inventory           ← Core data entry (base64 images)
    ↓
Module 3: Barcode Printing    ← Can overlap with Module 2 tail end
    ↓
Module 4: Customers             ← Can start in parallel with Module 3
    ↓
Module 5: Authentication        ← BEFORE sales (approved)
    ↓
Module 6: Sales                 ← Multi-item cart, PKR pricing, formulas
    ↓
Module 7: Dashboard
    ↓
Module 8: Settings (simplified)
```

**Estimated effort:**

| Module | Complexity | Estimate |
|--------|------------|----------|
| 0 — Foundation | Medium | 1–2 days |
| 1 — Categories | Low | 0.5–1 day |
| 2 — Inventory | High | 2–3 days |
| 3 — Barcode Printing | Medium | 1 day |
| 4 — Customers | Low | 0.5–1 day |
| 5 — Authentication | Medium | 1–2 days |
| 6 — Sales | High | 3–4 days |
| 7 — Dashboard | Low | 0.5–1 day |
| 8 — Settings | Low | 0.5 day |
| **Total** | | **~11–16 days** |

---

## 9. File & Folder Restructure

### 9.1 New folder structure

```
app/
├── api/
│   ├── categories/          # Keep, extend
│   ├── customers/           # Keep
│   ├── inventory/           # Rewrite (replaces products)
│   │   ├── route.ts
│   │   ├── [id]/route.ts
│   │   └── lookup/route.ts
│   ├── sales/               # Rewrite
│   │   ├── route.ts
│   │   ├── [id]/route.ts
│   │   └── [id]/close/route.ts
│   ├── silver-rates/        # New
│   │   ├── current/route.ts
│   │   └── refresh/route.ts
│   └── auth/                # New
│       ├── login/route.ts
│       ├── logout/route.ts
│       └── me/route.ts
├── dashboard/
│   ├── categories/          # Rebuild
│   ├── customers/           # Rebuild
│   ├── inventory/           # Rebuild
│   │   ├── page.tsx
│   │   ├── new/page.tsx
│   │   ├── [id]/page.tsx
│   │   ├── [id]/barcode/page.tsx
│   │   └── print-barcodes/page.tsx
│   ├── sales/               # Rebuild
│   ├── settings/            # Simplify
│   └── page.tsx             # Dashboard stats

components/
├── categories/              # New
├── customers/               # New
├── inventory/               # New (replaces products/)
├── sales/                   # Rewrite
├── settings/                # Simplify
├── dashboard/               # Keep
└── ui/                      # Keep

lib/
├── prisma.ts                # Keep
├── image-utils.ts           # New — base64 validate/encode
├── silver-rate-service.ts   # New — PKR rates
├── pricing-engine.ts        # New — quotient default 2
├── sku-generator.ts         # New (from product-utils.ts)
├── currency-utils.ts        # New — formatPKR()
├── auth.ts                  # New — session helpers
├── validations.ts           # Rewrite
├── api-response.ts          # Keep
└── settings-utils.ts        # Simplify

stores/
└── sale-session-store.ts    # New — multi-item cart

app/
└── login/page.tsx           # New — login page
middleware.ts                # New — route protection
```

### 9.2 Files to delete

```
app/dashboard/products/         # Entire folder
app/api/products/               # Entire folder
app/api/inventory/stock/        # Old stock calculation
app/api/sales/calculate/        # Replaced by pricing engine
components/products/            # Entire folder
components/sales/cart.tsx
components/sales/product-search.tsx
stores/sales-store.ts
lib/product-utils.ts            # Replaced by sku-generator.ts
lib/product-validations.ts      # Replaced
lib/inventory-utils.ts          # No longer needed (no IN/OUT)
```

---

## 10. Migration Strategy (Existing Data)

### 10.1 If database has existing products

| Old field (Product) | New field (InventoryItem) |
|---------------------|---------------------------|
| `name` | Drop (or map to stoneDetails) |
| `categoryId` | `categoryId` |
| `weight` | `weightGrams` |
| `sku` | `sku` |
| `barcode` | `barcode` |
| `silverRatePerGram` | `silverRateAtPurchase` |
| `stoneWeight` | `hasStone = true`, `stoneType = "Unknown"` |
| `material` | Drop (silver only) |
| `purity` | Drop |
| `makingCharge` | Drop |
| `goldRatePerGram` | Drop |
| — | `imageData` = empty or placeholder base64 |
| — | `purchasePricePerGram` = 0 (needs manual update) |
| — | `purchasePricePerPiece` = 0 |
| — | `status` = AVAILABLE |

### 10.2 Migration steps

1. Create new tables (`InventoryItem`, `SilverRateCache`)
2. Migrate `Product` → `InventoryItem` with data mapping
3. Migrate `SaleItem.productId` → `SaleItem.inventoryItemId`
4. Add new Sale fields (saleType, status, etc.) with defaults
5. Drop old tables (`Product`, `InventoryEntry`)
6. Drop unused enums

### 10.3 If database is empty (likely)

- Clean migration — just apply new schema
- Run seed script for sample categories + admin user

---

## 11. Environment Variables

```env
# Database (existing)
DATABASE_URL="postgresql://..."

# GoldPriceZ API (new)
GOLDPRICEZ_API_KEY="your-api-key-here"
SILVER_RATE_CURRENCY="PKR"          # fixed — all amounts in PKR

# Images (base64 in DB)
MAX_IMAGE_SIZE_MB=5

# Auth (new)
AUTH_SECRET="..."                   # session/JWT signing secret

# App (existing)
ADMIN_SECRET_KEY="..."              # legacy admin routes
```

---

## 12. Approved Decisions

| # | Question | Decision |
|---|----------|----------|
| 1 | **Currency** | **PKR everywhere** — rates, prices, invoices, API endpoint `currency/pkr` |
| 2 | **Default category quotient** | **2** when no keyword matches |
| 3 | **Product name field** | No name field; image + SKU + category identify item |
| 4 | **Multi-item sales** | **Yes** — multiple items per sale via cart (scan/add repeatedly) |
| 5 | **Stone field** | Toggle + stone type (free text) |
| 6 | **Image storage** | **Base64 in PostgreSQL** (`imageData` column) — no filesystem |
| 7 | **Delete sold items** | Block deletion of SOLD/RESERVED items |
| 8 | **Cancel custom order** | Yes — CANCELLED status reverts items to AVAILABLE |
| 9 | **Invoice format** | Redesign with per-item breakdown + PKR totals |
| 10 | **"onix" vs "onyx"** | Match both spellings |
| 11 | **Barcode scanner** | Camera + USB scanner (keyboard input into SKU field) |
| 12 | **Auth timing** | **Before sales module** (Module 5, before Module 6) |

---

## 13. Testing Checklist (Per Module)

### Module 1 — Categories
- [ ] Create category with name only
- [ ] Create category with name + description
- [ ] Duplicate name rejected
- [ ] Edit category name
- [ ] Delete empty category
- [ ] Delete category with inventory items blocked
- [ ] List shows correct item count

### Module 2 — Inventory
- [ ] Select image and preview (valid formats)
- [ ] Image rejected for > 5MB or wrong format
- [ ] Image stored as base64 in database
- [ ] Image renders correctly in list and detail views
- [ ] Silver rate auto-fills from API
- [ ] Silver rate is editable before save
- [ ] Purchase price per piece auto-calculates
- [ ] Quantity = 1 creates 1 item
- [ ] Quantity = 5 creates 5 items with unique SKUs
- [ ] Stone toggle shows/hides stone type field
- [ ] All fields validated on submit
- [ ] Inventory list shows all items with thumbnails
- [ ] Filter by category and status works

### Module 3 — Barcode Printing
- [ ] Single barcode print page renders correctly
- [ ] Bulk print renders all available items
- [ ] Print layout fits standard label sheets
- [ ] Barcode is scannable after print

### Module 4 — Customers
- [ ] CRUD operations work
- [ ] Search by name/phone/email
- [ ] Inline customer creation during sale works

### Module 5 — Authentication
- [ ] Login with seed admin credentials
- [ ] Invalid credentials rejected
- [ ] Unauthenticated access to `/dashboard` redirects to `/login`
- [ ] Session persists across page reloads
- [ ] Logout clears session
- [ ] `userId` available in sales API from session

### Module 6 — Sales
- [ ] SKU lookup returns correct item and adds to cart
- [ ] Barcode scan returns correct item and adds to cart
- [ ] Duplicate item in cart blocked
- [ ] Sold item lookup blocked
- [ ] Reserved item lookup blocked
- [ ] Multiple items can be added to one sale
- [ ] Per-item suggested price calculates correctly (quotient default = 2)
- [ ] Suggested total = sum of item suggested prices (PKR)
- [ ] User enters discounted price per item (defaults to suggested)
- [ ] Final total auto-calculated as sum of per-item discounted prices (PKR)
- [ ] Purchase sale creates COMPLETED sale with all items
- [ ] Purchase sale marks all items SOLD
- [ ] Custom order creates OPEN sale
- [ ] Custom order marks all items RESERVED
- [ ] Advance paid + remaining calculated correctly (PKR)
- [ ] Pickup date saved
- [ ] Close sale completes custom order
- [ ] Close sale marks all items SOLD
- [ ] Invoice shows per-item breakdown + PKR totals
- [ ] Invoice PDF downloads correctly

---

## Approval

**Owner decisions recorded in §12.**

Next steps:

1. ~~Resolve open questions~~ ✅ Done
2. Create `modules.md` with granular task tickets per module
3. Implement **Module 0 → Module 1 → ... → Module 8** sequentially
4. Each module gets a commit before moving to the next

---

*End of implementation plan.*
