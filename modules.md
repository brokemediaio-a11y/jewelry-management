# Venus Silver Collection — Module Task Breakdown

> **Reference:** Full architecture and business rules in [`implementation.md`](./implementation.md)
> **Status:** All modules (0–8) complete ✅
> **Rule:** Complete and verify each module before starting the next.

---

## How to use this document

- Each task has an **ID** (`M{n}.{t}`), **status** checkbox, **files**, and **acceptance criteria**
- Mark tasks `[x]` when done
- **Do not skip modules** — dependencies are ordered
- Commit after each module is fully verified

### Locked business rules (quick reference)

| Rule | Value |
|------|-------|
| Currency | PKR everywhere |
| Default category quotient | 2 |
| Multi-item sales | Yes — cart with per-item discounted prices |
| Sale final total | Auto-sum of per-item `finalPrice` |
| Images | Base64 stored in PostgreSQL |
| Auth | Module 5 — before Sales |

### Pricing formula

```
itemSuggestedPrice = ((todaySilverRatePKR × weightGrams) + purchasePricePerPiece) × categoryQuotient
saleSuggestedTotal = sum(itemSuggestedPrices)
saleFinalTotal     = sum(itemFinalPrices)   ← user enters per item
```

---

## Module 0 — Foundation & Infrastructure

**Goal:** New database schema, core services, seed data. No user-facing UI yet.
**Depends on:** Nothing
**Estimate:** 1–2 days

### Tasks

- [x] **M0.1** — Rewrite Prisma schema ✅
  - **Files:** `prisma/schema.prisma`
  - Add enums: `SaleType`, `SaleStatus`, `InventoryStatus`
  - Add models: `InventoryItem`, `SilverRateCache`
  - Modify: `Sale`, `SaleItem`, `Category`
  - Remove: `Product`, `InventoryEntry`, `Material` enum, `InventoryOperationType`
  - `InventoryItem.imageData` (Text), `imageMimeType` (String)
  - `SaleItem.finalPrice` per item; `Sale.finalPrice` = sum
  - **Acceptance:** `npx prisma validate` passes

- [x] **M0.2** — Create and apply migration ✅
  - **Files:** `prisma/migrations/*`
  - Run `npx prisma migrate dev --name restructure_v2`
  - Run `npx prisma generate`
  - **Acceptance:** `npx prisma migrate status` shows up to date

- [x] **M0.3** — Environment variables ✅
  - **Files:** `.env.example` (create)
  - Add: `GOLDPRICEZ_API_KEY`, `SILVER_RATE_CURRENCY=PKR`, `MAX_IMAGE_SIZE_MB=5`, `AUTH_SECRET`
  - **Acceptance:** `.env.example` documented, app reads vars

- [x] **M0.4** — Currency utilities ✅
  - **Files:** `lib/currency-utils.ts`
  - `formatPKR(amount: number): string` → `"Rs. 1,250.00"`
  - `parsePKR(value: string): number`
  - **Acceptance:** Formats PKR correctly with 2 decimal places

- [x] **M0.5** — Image utilities (base64) ✅
  - **Files:** `lib/image-utils.ts`
  - `validateImageBase64(dataUri, mimeType): void` — max 5MB, allowed types: jpeg/png/webp
  - `fileToBase64(file: File): Promise<string>` (client helper, can live in component too)
  - `getImageSrc(imageData: string): string` — returns usable src
  - **Acceptance:** Rejects invalid mime/size; accepts valid base64

- [x] **M0.6** — Silver rate service (PKR) ✅
  - **Files:** `lib/silver-rate-service.ts`
  - `getCurrentSilverRate(): Promise<number>` — cache-first, 5-min TTL
  - `fetchAndCacheSilverRate(): Promise<number>` — calls GoldPriceZ `currency/pkr/measure/gram/metal/all`
  - Reads `silver_gram_in_pkr` from response
  - Fallback to last cached rate on 429/5xx
  - Upsert `SilverRateCache`
  - **Acceptance:** Returns PKR rate; does not call API more than once per 5 min

- [x] **M0.7** — Silver rate API routes ✅
  - **Files:** `app/api/silver-rates/current/route.ts`, `app/api/silver-rates/refresh/route.ts`
  - `GET /api/silver-rates/current` → `{ ratePerGram, currency: "PKR", fetchedAt }`
  - `POST /api/silver-rates/refresh` → force refresh (admin only for now)
  - **Acceptance:** Endpoint returns PKR silver rate

- [x] **M0.8** — Pricing engine ✅
  - **Files:** `lib/pricing-engine.ts`
  - `getCategoryQuotient(categoryName: string): number`
    - `real_premium` → 4, `real` → 3, `zircon|onix|onyx` → 2, default → **2**
  - `calculateItemSuggestedPrice({ todaySilverRate, weightGrams, purchasePricePerPiece, categoryName }): number`
  - `calculateSuggestedTotal(items): number`
  - `calculateFinalTotal(items): number`
  - **Acceptance:** Unit-testable; default quotient = 2; premium checked before real

- [x] **M0.9** — SKU generator ✅
  - **Files:** `lib/sku-generator.ts`
  - `generateSKU(categoryName: string, sequence: number): string` → `RIN-20260611-0001`
  - `getNextSequence(categoryName: string): Promise<number>` — DB-backed daily counter
  - Barcode value = SKU
  - **Acceptance:** Sequential, unique SKUs per category per day

- [x] **M0.10** — Rewrite validations ✅
  - **Files:** `lib/validations.ts`
  - Schemas for: Category, InventoryItem (batch create), Sale (multi-item), Customer, Auth
  - Sale item schema includes `inventoryItemId` + `finalPrice` (positive PKR amount)
  - **Acceptance:** All new API shapes validated

- [x] **M0.11** — Seed script ✅
  - **Files:** `prisma/seed.ts`, update `package.json` with `"prisma": { "seed": "..." }`
  - Seed admin user: `admin@venus.com` / `admin123`
  - Seed categories: Rings, Bracelets, Necklaces, Chains, Real Rings, Real Premium Necklaces, Zircon Bracelets, Onix Chains
  - **Acceptance:** `npx prisma db seed` runs without error

- [x] **M0.12** — Cleanup deprecated code ✅
  - **Delete:** `app/dashboard/products/**`, `app/api/products/**`, `components/products/**`
  - **Delete:** `app/api/inventory/stock/**`, `app/api/sales/calculate/**`
  - **Delete:** `lib/product-utils.ts`, `lib/product-validations.ts`, `lib/inventory-utils.ts`
  - **Delete:** old inventory IN/OUT page logic
  - **Acceptance:** No broken imports; `npm run build` succeeds

- [x] **M0.13** — Update sidebar navigation ✅
  - **Files:** `components/dashboard/sidebar.tsx`
  - Remove "Products" link (if still present)
  - Ensure nav: Dashboard, Categories, Customers, Sales, Inventory, Settings
  - **Acceptance:** Sidebar reflects new structure

### Module 0 verification checklist

- [x] `npx prisma migrate status` — up to date (3 migrations applied)
- [x] Silver rate service returns PKR rate (~Rs. 601.17/gram verified via GoldPriceZ API)
- [x] `getCategoryQuotient("Rings")` returns 2
- [x] `getCategoryQuotient("Real Premium X")` returns 4
- [x] Seed admin user + 8 categories created (`admin@venus.com` / `admin123`)
- [x] `npm run build` passes

**Module 0 completed:** 2026-06-11

**Notes:**
- GoldPriceZ API returns double-encoded JSON string — fixed in `silver-rate-service.ts`
- API key read from `silver_api_key` or `GOLDPRICEZ_API_KEY` in `.env`
- Old Products module removed; Inventory/Sales pages are placeholders until Modules 2 & 6
- Settings rates form updated to read-only PKR silver rate from API

---

## Module 1 — Categories

**Goal:** Full CRUD UI for product categories.
**Depends on:** Module 0
**Estimate:** 0.5–1 day

### Tasks

- [x] **M1.1** — Extend categories API ✅
  - **Files:** `app/api/categories/route.ts`, `app/api/categories/[id]/route.ts`
  - `GET` list: include `_count.inventoryItems` as `itemCount`
  - `DELETE`: block if `itemCount > 0` → 409 error
  - **Acceptance:** API returns item counts; delete blocked when items exist

- [x] **M1.2** — Category form component ✅
  - **Files:** `components/categories/category-form.tsx`
  - Fields: name (required), description (optional)
  - Zod validation, react-hook-form
  - **Acceptance:** Form validates and submits

- [x] **M1.3** — Category table (integrated in page) ✅
  - **Files:** `components/categories/category-table.tsx`
  - Columns: Name, Description, Item Count, Created, Actions (Edit, Delete)
  - Search/filter by name
  - **Acceptance:** Lists all categories from API

- [x] **M1.4** — Delete category dialog ✅
  - **Files:** `components/categories/delete-category-dialog.tsx`
  - Confirm dialog; show error if category has items
  - **Acceptance:** Safe delete with confirmation

- [x] **M1.5** — Categories page ✅
  - **Files:** `app/dashboard/categories/page.tsx`
  - Wire table + create/edit dialog + delete dialog
  - "Add Category" button opens form dialog
  - Empty state message
  - **Acceptance:** Full CRUD works in browser

### Module 1 verification checklist

- [x] Categories API returns `inventoryItems` count
- [x] Delete blocked when category has inventory items (409)
- [x] Full CRUD UI at `/dashboard/categories` (search, create, edit, delete)
- [x] 8 seed categories present in database
- [x] `npm run build` passes

**Module 1 completed:** 2026-06-11

---

## Module 2 — Inventory

**Goal:** Add jewelry to stock with base64 images, PKR rates, auto SKU/barcode.
**Depends on:** Modules 0, 1
**Estimate:** 2–3 days

### Tasks

- [x] **M2.1** — Inventory API — list & create ✅
  - **Files:** `app/api/inventory/route.ts`
  - `GET`: pagination, filters (categoryId, status, sku, barcode), include category
  - List response: exclude full `imageData` — return `hasImage: true` + thumbnail not needed yet (or truncate for list)
  - `POST`: accept batch create with `quantity` N
  - Body: `imageData`, `imageMimeType`, `categoryId`, `weightGrams`, `silverRateAtPurchase`, `hasStone`, `stoneType`, `quantity`, `purchasePricePerGram`
  - Auto-calc `purchasePricePerPiece = purchasePricePerGram × weightGrams`
  - Generate N unique SKUs/barcodes in transaction
  - All amounts PKR
  - **Acceptance:** Creates N items; validates image base64

- [x] **M2.2** — Inventory API — single item ✅
  - **Files:** `app/api/inventory/[id]/route.ts`
  - `GET`: full detail including `imageData`
  - `PUT`: only if `status = AVAILABLE`; cannot change SKU/barcode
  - `DELETE`: only if `status = AVAILABLE`
  - **Acceptance:** Sold/reserved items cannot be edited/deleted

- [x] **M2.3** — Inventory lookup API (for sales) ✅
  - **Files:** `app/api/inventory/lookup/route.ts`
  - `GET ?sku=` or `?barcode=`
  - Return item + category + computed `suggestedSalePrice` (using current PKR rate + quotient)
  - Block if status ≠ AVAILABLE
  - **Acceptance:** Lookup by SKU and barcode works

- [x] **M2.4** — Image picker component ✅
  - **Files:** `components/inventory/image-picker.tsx`
  - Drag & drop + click to select
  - Preview image
  - Convert to base64 data URI client-side
  - Validate size (5MB) and type before encoding
  - **Acceptance:** Shows preview; outputs base64 string

- [x] **M2.5** — Inventory form component ✅
  - **Files:** `components/inventory/inventory-form.tsx`
  - Field order (exact):
    1. Image (image-picker) — required
    2. Category dropdown
    3. Weight (grams)
    4. Silver rate (auto-fetch from `/api/silver-rates/current`, editable, labeled with today's date, PKR)
    5. Stone toggle → stone type text field
    6. Quantity (integer ≥ 1)
    7. Purchase price per gram (PKR)
    8. Purchase price per piece (read-only, auto-calc)
    9. SKU preview (first item pattern)
    10. Barcode preview (CODE128 of first SKU)
  - Submit → `POST /api/inventory`
  - **Acceptance:** All fields work; live purchase price/piece calculation

- [x] **M2.6** — Inventory table component ✅
  - **Files:** `components/inventory/inventory-table.tsx`
  - Columns: Image thumb, SKU, Barcode, Category, Weight, Purchase Price/Piece, Silver Rate@Purchase, Status, Date, Actions
  - Filters: category, status; search by SKU/barcode
  - All prices formatted PKR
  - **Acceptance:** Lists items with thumbnails from base64

- [x] **M2.7** — Inventory detail component ✅
  - **Files:** `components/inventory/inventory-detail.tsx`
  - Full image, all fields, status badge, sale history link if sold
  - **Acceptance:** Shows complete item detail

- [x] **M2.8** — Inventory pages ✅
  - **Files:**
    - `app/dashboard/inventory/page.tsx` — list page
    - `app/dashboard/inventory/new/page.tsx` — create page
    - `app/dashboard/inventory/[id]/page.tsx` — detail page
  - **Acceptance:** Full inventory CRUD navigable in browser

### Module 2 verification checklist

- [x] Add inventory with image — image stored as base64 in DB
- [x] Silver rate auto-fills in PKR, editable
- [x] Quantity=3 creates 3 items with unique SKUs
- [x] Purchase price/piece auto-calculates
- [x] List shows thumbnails
- [x] Detail page shows full image
- [x] Lookup API returns item with suggested price

**Module 2 completed:** 2026-06-11

**Notes:**
- SKU preview uses client-safe `lib/sku-utils.ts` (server `sku-generator.ts` unchanged)
- Barcode preview via `barcode-preview.tsx` (jsbarcode CODE128)
- Inventory list: filters (category, status), SKU search, pagination, delete for AVAILABLE items

---

## Module 3 — Barcode Printing

**Goal:** Print barcodes for single items or bulk print all available inventory.
**Depends on:** Module 2
**Estimate:** 1 day

### Tasks

- [x] **M3.1** — Barcode label component ✅
  - **Files:** `components/inventory/barcode-label.tsx`
  - Renders CODE128 via jsbarcode
  - Shows SKU text below barcode
  - Optional: small image thumbnail
  - **Acceptance:** Barcode renders and is scannable

- [x] **M3.2** — Barcode print layout ✅
  - **Files:** `components/inventory/barcode-print-layout.tsx`
  - Grid layout for multiple labels per page
  - **Acceptance:** Labels align for printing

- [x] **M3.3** — Single barcode print page ✅
  - **Files:**
    - `app/dashboard/inventory/[id]/barcode/page.tsx`
    - `app/dashboard/inventory/barcode-print.css`
  - Print button triggers `window.print()`
  - **Acceptance:** Single item barcode prints cleanly

- [x] **M3.4** — Bulk barcode print page ✅
  - **Files:** `app/dashboard/inventory/print-barcodes/page.tsx`
  - Fetches all AVAILABLE items
  - "Print All Barcodes" button on inventory list links here
  - **Acceptance:** All available item barcodes print on one page

- [x] **M3.5** — Wire print actions in inventory list/detail ✅
  - **Files:** `components/inventory/inventory-table.tsx`, inventory detail page
  - Row action: "Print Barcode"
  - List header: "Print All Barcodes" button
  - **Acceptance:** Print accessible from list and detail

### Module 3 verification checklist

- [x] Single barcode print page works
- [x] Bulk print renders all available items
- [x] Printed barcode is scannable back into lookup

**Module 3 completed:** 2026-06-12

**Notes:**
- `barcode-label.tsx` renders CODE128 with SKU text below; optional thumbnail and category/weight
- `barcode-print-layout.tsx` uses 3×5 grid per A4 page with page breaks
- Print actions wired in inventory table (row), detail page, and list header

---

## Module 4 — Customers

**Goal:** Customer database management + inline create during sales (prep).
**Depends on:** Module 0
**Estimate:** 0.5–1 day

### Tasks

- [x] **M4.1** — Customer form component ✅
  - **Files:** `components/customers/customer-form.tsx`
  - Fields: name (required), phone, email, address
  - Works as dialog or inline
  - **Acceptance:** Creates/updates customer via API

- [x] **M4.2** — Customer table component ✅
  - **Files:** `components/customers/customer-table.tsx`
  - Columns: Name, Phone, Email, Actions
  - Search by name/phone/email
  - **Acceptance:** Lists and searches customers

- [x] **M4.3** — Customers page ✅
  - **Files:** `app/dashboard/customers/page.tsx`
  - Full CRUD with dialogs
  - **Acceptance:** Customer management works in browser

- [x] **M4.4** — Customer search/select component (for sales prep) ✅
  - **Files:** `components/customers/customer-select.tsx` (rewrite existing)
  - Searchable dropdown + inline "Add New" form
  - **Acceptance:** Can select existing or create new customer

### Module 4 verification checklist

- [x] Create, edit, delete customer
- [x] Search works
- [x] Customer select component ready for sales module

**Module 4 completed:** 2026-06-12

**Notes:**
- `customer-select.tsx` provides searchable dropdown with inline "Add New Customer" form
- Search filters client-side by name, phone, and email
- Existing `/api/customers` routes used without changes

---

## Module 5 — Authentication

**Goal:** Login, sessions, protected routes. Required before Sales.
**Depends on:** Module 0
**Estimate:** 1–2 days

### Tasks

- [x] **M5.1** — Auth service ✅
  - **Files:** `lib/auth.ts`
  - `hashPassword`, `verifyPassword` (bcrypt)
  - `createSession(userId)`, `getSession()`, `destroySession()`
  - HTTP-only cookie or JWT approach
  - **Acceptance:** Session created and read correctly

- [x] **M5.2** — Auth API routes ✅
  - **Files:**
    - `app/api/auth/login/route.ts`
    - `app/api/auth/logout/route.ts`
    - `app/api/auth/me/route.ts`
  - Login: email + password → session cookie
  - Logout: clear cookie
  - Me: return current user (id, name, email, role)
  - **Acceptance:** Login/logout/me cycle works via API

- [x] **M5.3** — Middleware route protection ✅
  - **Files:** `middleware.ts`
  - Protect `/dashboard/*` — redirect to `/login` if no session
  - Allow `/login`, `/api/auth/*`, static assets
  - **Acceptance:** Unauthenticated users cannot access dashboard

- [x] **M5.4** — Login page ✅
  - **Files:** `app/login/page.tsx`
  - Email + password form
  - Error messages for invalid credentials
  - Redirect to `/dashboard` on success
  - **Acceptance:** Can log in with seed admin credentials

- [x] **M5.5** — Navbar user menu ✅
  - **Files:** `components/dashboard/navbar.tsx`, `app/dashboard/layout.tsx`
  - Show logged-in user name
  - Logout button
  - **Acceptance:** User sees name and can logout

- [x] **M5.6** — Wire userId in protected APIs ✅
  - **Files:** sales routes (prep), any admin routes
  - `getSession()` in API routes to get real `userId`
  - **Acceptance:** APIs reject unauthenticated requests where needed

### Module 5 verification checklist

- [x] Login with `admin@venus.com` / `admin123`
- [x] Invalid login rejected
- [x] `/dashboard` redirects to `/login` when logged out
- [x] Session persists on page reload
- [x] Logout works
- [x] `/api/auth/me` returns user info

**Module 5 completed:** 2026-06-12

**Notes:**
- JWT session in HTTP-only cookie via `jose` + `AUTH_SECRET`
- Middleware protects `/dashboard/*`; logged-in users redirected away from `/login`
- Admin routes (settings, users, silver rate refresh) use `requireAdmin()`
- Sales POST uses `requireAuth()` (ready for Module 6)

---

## Module 6 — Sales

**Goal:** Multi-item POS — scan/SKU → cart → per-item discounted price → checkout.
**Depends on:** Modules 0–5
**Estimate:** 3–4 days

### Tasks

- [x] **M6.1** — Sale session store ✅
  - **Files:** `stores/sale-session-store.ts`
  - Cart with `CartItem` including `suggestedSalePrice` + `finalPrice` per item
  - `addToCart`, `removeFromCart`, `updateItemFinalPrice`, `clearCart`
  - `getSuggestedTotal()` — sum of suggested prices
  - `getFinalTotal()` — sum of per-item final prices
  - `silverRateAtSale` fetched once on page load
  - Block duplicate `inventoryItemId` in cart
  - **Acceptance:** Store manages multi-item cart with per-item pricing

- [x] **M6.2** — Barcode scanner component ✅
  - **Files:** `components/sales/barcode-scanner.tsx`
  - Camera-based scanning (`html5-qrcode` or `@zxing/browser`)
  - On scan → trigger lookup callback
  - **Acceptance:** Scans barcode and returns value

- [x] **M6.3** — SKU input component ✅
  - **Files:** `components/sales/sku-input.tsx`
  - Text input for manual SKU entry
  - USB barcode scanners type here (keyboard wedge)
  - Enter key triggers lookup
  - **Acceptance:** SKU entry triggers lookup

- [x] **M6.4** — Cart item card component ✅
  - **Files:** `components/sales/cart-item-card.tsx`
  - Shows: image (base64), SKU, category, weight, stone
  - Silver rate at purchase, today's rate, quotient
  - Suggested price (read-only, PKR)
  - **Final price input (editable, PKR)** — defaults to suggested price
  - Remove button
  - **Acceptance:** Per-item final price editable; updates final total

- [x] **M6.5** — Sale cart component ✅
  - **Files:** `components/sales/sale-cart.tsx`
  - List of cart item cards
  - Suggested total (read-only)
  - **Final total (read-only, auto-sum)**
  - Clear cart button
  - **Acceptance:** Totals update live as item prices change

- [x] **M6.6** — Sale type & custom order components ✅
  - **Files:**
    - `components/sales/sale-type-selector.tsx`
    - `components/sales/custom-order-fields.tsx`
  - Sale type: Purchase / Custom Order
  - Custom order: advance paid (PKR), remaining (auto), pickup date
  - Remaining = `finalTotal - advancePaid`
  - **Acceptance:** Custom order fields show/hide correctly

- [x] **M6.7** — Pricing panel & checkout section ✅
  - **Files:** `components/sales/pricing-panel.tsx`
  - Customer select (from M4.4)
  - Payment method dropdown
  - Notes field
  - Complete Sale button
  - **Acceptance:** All checkout fields wired

- [x] **M6.8** — New sale page ✅
  - **Files:** `app/dashboard/sales/new/page.tsx`
  - Layout: lookup (scan/SKU) at top → cart below → checkout at bottom
  - On lookup success: fetch `/api/inventory/lookup`, add to cart
  - Fetch silver rate once on mount
  - Submit → `POST /api/sales` with `{ items: [{ inventoryItemId, finalPrice }, ...] }`
  - **Acceptance:** Full multi-item sale flow works in browser

- [x] **M6.9** — Sales API — create (multi-item) ✅
  - **Files:** `app/api/sales/route.ts`
  - `POST`: authenticate user, validate items array (min 1)
  - Per item: verify AVAILABLE, compute suggested price, store `finalPrice` from request
  - Sale `suggestedSalePrice` = sum of item suggested
  - Sale `finalPrice` = sum of item finalPrice (server-side, not from client total)
  - Purchase → COMPLETED, items → SOLD
  - Custom Order → OPEN, items → RESERVED; validate advance < finalPrice
  - Transaction: Sale + SaleItems + inventory status updates
  - Invoice number generation
  - **Acceptance:** Multi-item sale created correctly in DB

- [x] **M6.10** — Sales API — list & detail ✅
  - **Files:** `app/api/sales/route.ts` (GET), `app/api/sales/[id]/route.ts`
  - List: filters (saleType, status, date, customer), include item count
  - Detail: full sale with all items, per-item pricing breakdown, customer, user
  - **Acceptance:** List and detail return complete data

- [x] **M6.11** — Close sale API ✅
  - **Files:** `app/api/sales/[id]/close/route.ts`
  - Only OPEN + CUSTOM_ORDER sales
  - Set status COMPLETED, `closedAt` = now
  - All items → SOLD
  - **Acceptance:** Custom order can be closed

- [x] **M6.12** — Cancel sale API ✅
  - **Files:** `app/api/sales/[id]/route.ts` (DELETE)
  - Set status CANCELLED
  - Revert all items → AVAILABLE
  - **Acceptance:** Cancelled sale frees inventory

- [x] **M6.13** — Sales list page ✅
  - **Files:** `app/dashboard/sales/page.tsx`
  - Table: invoice #, date, customer, item count, type, status, final total (PKR)
  - Filters, New Sale button
  - **Acceptance:** Lists all sales

- [x] **M6.14** — Sale detail / invoice page ✅
  - **Files:** `app/dashboard/sales/[id]/page.tsx`
  - Invoice with per-item table: suggested + final price per item
  - Totals: suggested total, final total (PKR)
  - Custom order section if applicable
  - Close Sale button (OPEN custom orders)
  - Print + PDF download
  - **Acceptance:** Invoice shows per-item and total pricing

- [x] **M6.15** — Close sale dialog ✅
  - **Files:** `components/sales/close-sale-dialog.tsx`
  - Confirm remaining payment amount in PKR
  - **Acceptance:** Close sale flow works from detail page

- [x] **M6.16** — Cleanup old sales code ✅
  - **Delete:** `stores/sales-store.ts`, `components/sales/cart.tsx`, `components/sales/product-search.tsx`, `components/sales/sale-summary.tsx` (rewrite if needed)
  - **Acceptance:** No dead code references

### Module 6 verification checklist

- [x] Scan/SKU adds item to cart
- [x] Add 3 different items to one sale
- [x] Each item shows suggested price (PKR)
- [x] Each item has editable final/discounted price
- [x] Suggested total = sum of suggested prices
- [x] Final total = sum of per-item final prices (auto)
- [x] Purchase sale: all items SOLD, sale COMPLETED
- [x] Custom order: all items RESERVED, advance/remaining correct
- [x] Close sale: items SOLD, sale COMPLETED
- [x] Invoice shows per-item suggested + final prices
- [x] Duplicate item in cart blocked
- [x] Sold item cannot be added to cart

**Module 6 completed:** 2026-06-12

**Notes:**
- Zustand `sale-session-store` manages multi-item cart with per-item pricing
- Camera scanner via `html5-qrcode`; SKU input supports USB wedge scanners
- Invoice generation with print + PDF download on sale detail page
- Old sales placeholder code replaced; no legacy sales-store files remained

---

## Module 7 — Dashboard

**Goal:** Live stats from real data.
**Depends on:** Modules 1–6
**Estimate:** 0.5–1 day

### Tasks

- [x] **M7.1** — Dashboard stats API ✅
  - **Files:** `app/api/dashboard/stats/route.ts`
  - Return: available inventory count, monthly sales count, monthly revenue (PKR), open custom orders, recent 5 sales
  - **Acceptance:** API returns real aggregated data

- [x] **M7.2** — Dashboard page ✅
  - **Files:** `app/dashboard/page.tsx`
  - Stat cards wired to API
  - Recent sales list
  - Open custom orders alert
  - All amounts in PKR
  - **Acceptance:** Dashboard shows live data, not zeros

### Module 7 verification checklist

- [x] Stats reflect actual inventory and sales counts
- [x] Revenue shown in PKR
- [x] Recent sales list populated

**Module 7 completed:** 2026-06-12

**Notes:**
- Revenue counts COMPLETED sales only for the current month
- Alert banner shown when open custom orders exist

---

## Module 8 — Settings

**Goal:** Shop info + read-only PKR silver rate display.
**Depends on:** Module 0
**Estimate:** 0.5 day

### Tasks

- [x] **M8.1** — Simplify settings page ✅
  - **Files:** `app/dashboard/settings/page.tsx`, `components/settings/*`
  - Keep: shop name, address, phone, email
  - Remove: manual gold/silver rate entry
  - Add: read-only current silver rate (PKR) + "Refresh" button
  - **Acceptance:** Shop info editable; silver rate read-only from API

- [x] **M8.2** — Update settings API/utils ✅
  - **Files:** `lib/settings-utils.ts`, `app/api/settings/rates/route.ts`
  - Remove gold rate logic
  - Silver rate comes from `silver-rate-service`, not manual settings
  - **Acceptance:** No manual rate override in settings

### Module 8 verification checklist

- [x] Shop info saves correctly
- [x] Silver rate displays in PKR from API cache
- [x] Refresh button updates rate

**Module 8 completed:** 2026-06-12

**Notes:**
- Removed manual gold/silver rate settings (`/api/settings/rates` deleted)
- Added **Pricing** tab: editable formula + category quotient rules (stored in `pricing_config` setting)
- Formula variables: `silverRate`, `weightGrams`, `purchasePricePerPiece`, `quotient`
- Sales, lookup, and POS use saved pricing config from DB

---

## Implementation sequence summary

```
M0 Foundation ──→ M1 Categories ──→ M2 Inventory ──→ M3 Barcodes
                                                        │
M4 Customers ──────────────────────────────────────────┤
                                                        │
                              M5 Auth ──────────────────┤
                                                        │
                              M6 Sales ←────────────────┘
                                  │
                    M7 Dashboard + M8 Settings
```

---

## Per-module commit message format

```
feat(module-{n}): {short description}

- M{n}.1: ...
- M{n}.2: ...
```

Example:
```
feat(module-1): implement categories CRUD UI

- M1.1: extend categories API with item counts
- M1.2-M1.5: category form, table, delete dialog, page
```

---

*End of modules.md*
