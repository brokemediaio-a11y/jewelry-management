# Venus Silver Collection — Stage 2 Module Task Breakdown

> **Reference:** Full architecture in [`implementation_stage2.md`](./implementation_stage2.md)  
> **Stage 1:** [`modules.md`](./modules.md) (Modules 0–8 complete ✅)  
> **Status:** Planning — not started  
> **Rule:** Complete and verify each module before starting dependent modules.

---

## How to use this document

- Each task has an **ID** (`S2-M{n}.{t}`), **status** checkbox, **files**, and **acceptance criteria**
- Mark tasks `[x]` when done
- **Respect dependency order** — see [Implementation order](#implementation-order)
- Commit after each module is fully verified

### Updated business rules (Stage 2 quick reference)

| Rule | Value |
|------|-------|
| Currency | PKR everywhere |
| Sale modes | **In Inventory** (SKU/barcode) \| **Not in Inventory** (external custom) |
| External orders | Custom order only; sample image + description + manual cost required |
| Custom order close | Requires Karegar workshop status = **COMPLETE** |
| Expense types | **Beopari** \| **Karegar** \| **Shop** \| **Home** |
| Beopari payment | Via Beopari expense linked to one or more purchases |
| Karegar payment | Via Karegar expense linked to karegar + one or more workshop orders |
| Shop / Home expense | Required description (justification); updates cash in hand + profit |
| Cash in Hand | Cash sales inflows − cash expenses (see implementation doc §8.2) |

### Pricing formula (unchanged from Stage 1)

```
itemSuggestedPrice = ((todaySilverRate × weightGrams) + stonePrice) × qualityQuotient
qualityQuotient: PREMIUM → 4, LOCAL → 2
minFinalPrice = purchasePricePerPiece
```

---

## Implementation order

```
S2-M9  Dashboard enhancements          (no deps)
S2-M10 Customer purchase history       (no deps)
S2-M11 Sales dual mode + WorkshopOrder  (deps: none, but blocks M13 close gate)
S2-M12 Expenses + Cash in Hand         (deps: none)
S2-M13 Beopari module                  (deps: M12)
S2-M14 Karegar module + close gate     (deps: M11, M12)
S2-M15 Integration & QA                (deps: all)
```

---

## Module S2-M9 — Dashboard Enhancements

**Goal:** New Sale shortcut, improved recent sales table, Cash in Hand card.  
**Depends on:** Nothing  
**Estimate:** 0.5–1 day

### Tasks

- [ ] **S2-M9.1** — New Sale button on dashboard
  - **Files:** `app/dashboard/page.tsx`, optional `components/dashboard/quick-actions.tsx`
  - Primary button in page header → `/dashboard/sales/new`
  - **Acceptance:** One click from dashboard starts a new sale

- [ ] **S2-M9.2** — Recent sales column reorder + date first
  - **Files:** `app/dashboard/page.tsx`
  - Column order: Date → Invoice → Customer → Items Summary → Items count → Status → Total → Actions
  - **Acceptance:** Date is first column; table matches client spec

- [ ] **S2-M9.3** — Sale summary utility
  - **Files:** `lib/sale-summary-utils.ts`
  - `formatSaleItemsSummary(sale): string` — joins `{category} ({stone})` per line
  - Handle external sales: truncated `orderDescription`
  - **Acceptance:** Unit-testable; handles no-stone items

- [ ] **S2-M9.4** — Extend dashboard stats API with items summary
  - **Files:** `app/api/dashboard/stats/route.ts`
  - Include `items` with category/stone snapshots on recent sales query
  - Return `itemsSummary` per sale
  - **Acceptance:** API returns formatted summary string per recent sale

- [ ] **S2-M9.5** — Cash in Hand aggregation
  - **Files:** `lib/cash-utils.ts`, `app/api/dashboard/stats/route.ts`
  - Implement `calculateCashInHand()` per implementation_stage2.md §8.2
  - Return `cashInHand` in stats response
  - **Acceptance:** Cash sale increases; cash expense decreases

- [ ] **S2-M9.6** — Cash in Hand dashboard card
  - **Files:** `app/dashboard/page.tsx`
  - New card with label "Cash in Hand" and subtitle explaining formula
  - **Acceptance:** Card visible on dashboard; shows PKR formatted value

### Module S2-M9 verification

- [ ] New Sale navigates to sales/new
- [ ] Recent sales table column order correct
- [ ] Items Summary shows category + stone for inventory sales
- [ ] Cash in Hand card renders with numeric value

---

## Module S2-M10 — Customer Purchase History

**Goal:** Full purchase history per customer on detail page.  
**Depends on:** S2-M9.3 (summary util) recommended  
**Estimate:** 1 day

### Tasks

- [ ] **S2-M10.1** — Customer detail page route
  - **Files:** `app/dashboard/customers/[id]/page.tsx`
  - **Acceptance:** `/dashboard/customers/[id]` loads without error

- [ ] **S2-M10.2** — Extend customer API with sales history
  - **Files:** `app/api/customers/[id]/route.ts` or `app/api/customers/[id]/purchases/route.ts`
  - Paginated sales with: invoice, date, type, source, finalPrice, advance, status, itemsSummary, workshop status
  - **Acceptance:** GET returns complete purchase list for customer

- [ ] **S2-M10.3** — Customer info header component
  - **Files:** `components/customers/customer-detail-header.tsx`
  - Show name, phone, email, address; Edit + Delete actions
  - **Acceptance:** Matches customer data from API

- [ ] **S2-M10.4** — Purchase history table component
  - **Files:** `components/customers/customer-purchase-history.tsx`
  - Columns: Date, Invoice, Type, Source, Items/Description, Total, Paid, Status, View
  - Link to `/dashboard/sales/[id]`
  - **Acceptance:** All customer sales visible; empty state when none

- [ ] **S2-M10.5** — Wire View action on customer list
  - **Files:** `components/customers/customer-table.tsx`, `app/dashboard/customers/page.tsx`
  - Add View/Eye icon → customer detail
  - **Acceptance:** Navigate from list to detail works

### Module S2-M10 verification

- [ ] Customer with multiple sales shows full history
- [ ] Custom orders show advance + OPEN status
- [ ] Click through to sale detail works

---

## Module S2-M11 — Sales Dual Mode + Workshop Orders

**Goal:** In Inventory / Not in Inventory switch; external custom orders; auto-create workshop orders.  
**Depends on:** Nothing (WorkshopOrder schema introduced here)  
**Estimate:** 2–3 days

### Tasks

- [ ] **S2-M11.1** — Prisma: SaleSource, WorkshopOrder, schema changes
  - **Files:** `prisma/schema.prisma`, migration
  - Add `SaleSource`, `WorkshopOrderStatus`, `WorkshopOrder` model
  - Add to `Sale`: source, sampleImageData, sampleImageMimeType, orderDescription, manualCost
  - Make `SaleItem.inventoryItemId` optional
  - Add `SaleItem.categoryName` snapshot
  - **Acceptance:** `npx prisma migrate dev` succeeds; backfill source=INVENTORY

- [ ] **S2-M11.2** — Validations for external sale
  - **Files:** `lib/validations.ts`
  - `createExternalCustomOrderSchema` per implementation doc
  - **Acceptance:** Invalid payloads rejected with clear messages

- [ ] **S2-M11.3** — Workshop utils
  - **Files:** `lib/workshop-utils.ts`
  - `createWorkshopOrderForSale(saleId)`, status transition helpers
  - **Acceptance:** Auto-create on custom order

- [ ] **S2-M11.4** — Sale mode switch UI
  - **Files:** `components/sales/sale-mode-switch.tsx`, `app/dashboard/sales/new/page.tsx`
  - Segmented control: In Inventory | Not in Inventory
  - URL param `?mode=external` support from dashboard New Sale button (optional)
  - **Acceptance:** Toggle switches entire page layout

- [ ] **S2-M11.5** — External custom order form
  - **Files:** `components/sales/external-order-form.tsx`
  - Fields: customer, sample image, description, manual cost, final price, advance, pickup date, payment method, notes
  - Sale type locked to Custom Order
  - **Acceptance:** Form validates; no barcode/SKU UI shown

- [ ] **S2-M11.6** — POST /api/sales — external branch
  - **Files:** `app/api/sales/route.ts`
  - Handle `source=EXTERNAL`; create Sale without SaleItem
  - Create WorkshopOrder (SENT_TO_WORKSHOP)
  - **Acceptance:** 201 response; workshop order exists in DB

- [ ] **S2-M11.7** — POST /api/sales — inventory custom orders create workshop
  - **Files:** `app/api/sales/route.ts`
  - On `saleType=CUSTOM_ORDER` + `source=INVENTORY`, also create WorkshopOrder
  - **Acceptance:** Inventory custom order appears in workshop queue (after M14 UI)

- [ ] **S2-M11.8** — Sale detail: external order display
  - **Files:** `app/dashboard/sales/[id]/page.tsx`, `components/sales/workshop-status-banner.tsx`
  - Show sample image, description, manual cost for EXTERNAL
  - Show workshop status banner for OPEN custom orders
  - **Acceptance:** Invoice/detail readable for external orders

- [ ] **S2-M11.9** — Sale summary snapshots on create
  - **Files:** `app/api/sales/route.ts`
  - Populate `SaleItem.categoryName` + stone fields on inventory sales
  - **Acceptance:** Dashboard/customer summaries work without joining inventory

- [ ] **S2-M11.10** — Print/PDF for external orders
  - **Files:** `app/dashboard/sales/[id]/page.tsx`, `print.css`
  - External layout without SKU table; show description + sample thumbnail
  - **Acceptance:** Print preview correct for external sale

### Module S2-M11 verification

- [ ] In Inventory flow unchanged
- [ ] Not in Inventory creates OPEN external sale
- [ ] Sample image stored and displayed
- [ ] WorkshopOrder created for all custom orders
- [ ] manualCost stored for profit calculations

---

## Module S2-M12 — Expenses Module + Cash Metrics

**Goal:** Track four expense types (Beopari, Karegar, Shop, Home); integrate with dashboard cash/profit.  
**Depends on:** Nothing (Beopari/Karegar allocation links wired in M13/M14)  
**Estimate:** 2 days

### Tasks

- [ ] **S2-M12.1** — Prisma Expense model + allocation tables
  - **Files:** `prisma/schema.prisma`, migration
  - Enum: `ExpenseType` (BEOPARI, KAREGAR, SHOP, HOME)
  - Models: `Expense`, `ExpenseBeopariAllocation`, `ExpenseWorkshopAllocation`
  - FK placeholders: `beopariId`, `karegarId` (nullable until M13/M14)
  - **Acceptance:** Migration applies

- [ ] **S2-M12.2** — Expense validations + utils
  - **Files:** `lib/validations.ts`, `lib/expense-utils.ts`
  - Per-type schemas: Beopari/Karegar require allocations; Shop/Home require description
  - `validateAllocationsSumToAmount()`, recalculate beopari/karegar paid totals
  - **Acceptance:** Invalid type/field combos rejected with clear messages

- [ ] **S2-M12.3** — Expenses API CRUD
  - **Files:** `app/api/expenses/route.ts`, `app/api/expenses/[id]/route.ts`
  - Filters: expenseType, dateFrom, dateTo, beopariId, karegarId
  - Create/update accepts allocation arrays for BEOPARI/KAREGAR types
  - **Acceptance:** Full CRUD with auth

- [ ] **S2-M12.4** — Expenses list page
  - **Files:** `app/dashboard/expenses/page.tsx`, `components/expenses/expense-table.tsx`
  - Filters by expense type + pagination
  - **Acceptance:** Lists all expenses with type-specific summary column

- [ ] **S2-M12.5** — Expense create/edit form
  - **Files:** `app/dashboard/expenses/new/page.tsx`, `components/expenses/expense-form.tsx`
  - Expense type selector: Beopari | Karegar | Shop | Home
  - **Beopari:** beopari dropdown + multi-select purchases + allocation UI (active after M13)
  - **Karegar:** karegar dropdown + multi-select workshop orders + allocation UI (active after M14)
  - **Shop / Home:** required description/justification textarea only (no payee fields)
  - **Acceptance:** Can create Shop and Home expenses end-to-end; description required

- [ ] **S2-M12.6** — Sidebar: Expenses nav item
  - **Files:** `components/dashboard/sidebar.tsx`
  - **Acceptance:** Expenses visible in sidebar

- [ ] **S2-M12.7** — Dashboard: net profit includes expenses
  - **Files:** `app/api/dashboard/stats/route.ts`, `app/dashboard/page.tsx`
  - `monthlyNetProfit = COGS profit − expenses this month` (all four types)
  - Update card subtitle
  - **Acceptance:** Creating any expense type reduces net profit on dashboard

- [ ] **S2-M12.8** — Wire cash-utils into stats (if not done in M9)
  - **Files:** `lib/cash-utils.ts`, `app/api/dashboard/stats/route.ts`
  - **Acceptance:** Cash expense (any type) reduces Cash in Hand

### Module S2-M12 verification

- [ ] Create Shop expense with required description
- [ ] Create Home expense with required description
- [ ] Expense appears in list with correct type label
- [ ] Dashboard net profit decreases
- [ ] Cash in Hand decreases for CASH expense

---

## Module S2-M13 — Beopari (Vendor) Module

**Goal:** Supplier ledger with purchases and expense-linked payments.  
**Depends on:** S2-M12 (Expenses)  
**Estimate:** 2–3 days

### Tasks

- [ ] **S2-M13.1** — Prisma Beopari + BeopariPurchase
  - **Files:** `prisma/schema.prisma`, migration
  - **Acceptance:** Models + relations to Expense

- [ ] **S2-M13.2** — Beopari utils
  - **Files:** `lib/beopari-utils.ts`
  - `calculatePurchaseTotal(weight, costPerGram)`
  - `aggregateBeopariLedger(beopariId)` → total, paid, remaining
  - **Acceptance:** Totals match sum of purchases − payments

- [ ] **S2-M13.3** — Beopari API
  - **Files:** `app/api/beopari/route.ts`, `app/api/beopari/[id]/route.ts`
  - List with aggregated totals per beopari
  - **Acceptance:** CRUD for beopari

- [ ] **S2-M13.4** — Beopari purchases API
  - **Files:** `app/api/beopari/[id]/purchases/route.ts`, `app/api/beopari/purchases/[id]/route.ts`
  - **Acceptance:** Create purchase recalculates totals

- [ ] **S2-M13.5** — Beopari list page
  - **Files:** `app/dashboard/beopari/page.tsx`, `components/beopari/beopari-table.tsx`
  - Columns: Name, Start Date, Total, Paid, Remaining, Actions
  - Add Beopari button
  - **Acceptance:** Table matches spec

- [ ] **S2-M13.6** — Beopari detail + purchase history
  - **Files:** `app/dashboard/beopari/[id]/page.tsx`
  - Purchase history table + payment history (linked expenses)
  - New Purchase button
  - **Acceptance:** Click beopari row opens detail

- [ ] **S2-M13.7** — New purchase form
  - **Files:** `app/dashboard/beopari/[id]/purchases/new/page.tsx`, `components/beopari/purchase-form.tsx`
  - Fields: category, total weight, quantity, cost/gram, date, notes
  - Live totalCost preview
  - **Acceptance:** Purchase saved; totals update on list

- [ ] **S2-M13.8** — Expense form: Beopari Expense linkage
  - **Files:** `components/expenses/expense-form.tsx`, `app/api/expenses/route.ts`
  - Beopari Expense → select beopari → multi-select purchases → allocation amounts ≤ remaining
  - On create: purchase + beopari paid/remaining recalculated; cash in hand updated
  - **Acceptance:** Paying 5000 on 10000 purchase shows 5000 paid, 5000 remaining; multi-purchase split works

- [ ] **S2-M13.9** — Sidebar: Beopari nav item
  - **Files:** `components/dashboard/sidebar.tsx`
  - **Acceptance:** Beopari in sidebar

### Module S2-M13 verification

- [ ] Add beopari → add purchase → pay via Beopari expense
- [ ] Remaining amount updates correctly
- [ ] Beopari list aggregates match detail page

---

## Module S2-M14 — Karegar (Worker) Module + Close-Sale Gate

**Goal:** Workshop queue for all custom orders; assign karegar; status workflow; block close until complete.  
**Depends on:** S2-M11 (WorkshopOrder), S2-M12 (Expenses)  
**Estimate:** 2–3 days

### Tasks

- [ ] **S2-M14.1** — Prisma Karegar model
  - **Files:** `prisma/schema.prisma`, migration (if not in M11)
  - Link WorkshopOrder.karegarId → Karegar
  - **Acceptance:** Karegar CRUD ready

- [ ] **S2-M14.2** — Karegar API
  - **Files:** `app/api/karegar/route.ts`, `app/api/karegar/[id]/route.ts`
  - **Acceptance:** List/create/update karegars

- [ ] **S2-M14.3** — Workshop orders API
  - **Files:** `app/api/workshop-orders/route.ts`, `app/api/workshop-orders/[id]/route.ts`
  - GET: queue with sale, customer, source, summary filters
  - PATCH: assign karegar, update status, set completedAt on COMPLETE
  - **Acceptance:** Status transitions validated

- [ ] **S2-M14.4** — Karegar main page + workshop queue
  - **Files:** `app/dashboard/karegar/page.tsx`, `components/karegar/workshop-queue-table.tsx`
  - Table columns per implementation doc §7.3
  - Assigned To dropdown; Status dropdown
  - **Acceptance:** All custom orders (inventory + external) listed

- [ ] **S2-M14.5** — Add Karegar dialog/page
  - **Files:** `components/karegar/karegar-form.tsx`, `app/dashboard/karegar/workers/new/page.tsx`
  - **Acceptance:** New karegar appears in assign dropdown

- [ ] **S2-M14.6** — Karegar detail + payment history
  - **Files:** `app/dashboard/karegar/workers/[id]/page.tsx`
  - Show assigned orders + total payments (from expenses)
  - Record Payment button → expense form pre-filled
  - **Acceptance:** Payments visible per karegar

- [ ] **S2-M14.7** — Expense form: Karegar Expense linkage
  - **Files:** `components/expenses/expense-form.tsx`, `app/api/expenses/route.ts`
  - Karegar Expense → select karegar → multi-select workshop orders → allocation amounts
  - On create: karegar + per-order paid totals updated; cash in hand updated
  - **Acceptance:** Karegar expense created with one or more order allocations

- [ ] **S2-M14.8** — Close sale gate
  - **Files:** `app/api/sales/[id]/close/route.ts`, `app/dashboard/sales/[id]/page.tsx`
  - Reject close if `workshopOrder.status !== COMPLETE`
  - Disable Close button in UI with tooltip
  - **Acceptance:** Cannot close until karegar marks complete

- [ ] **S2-M14.9** — Sale detail workshop block
  - **Files:** `components/sales/workshop-status-banner.tsx`, sale detail page
  - Show assigned karegar, status, link to karegar module
  - **Acceptance:** Staff sees workshop state on sale

- [ ] **S2-M14.10** — Sidebar: Karegar nav item
  - **Files:** `components/dashboard/sidebar.tsx`
  - **Acceptance:** Karegar in sidebar

- [ ] **S2-M14.11** — Backfill workshop orders migration seed
  - **Files:** `prisma/seed.ts` or one-time script
  - Existing CUSTOM_ORDER sales get WorkshopOrder (COMPLETE if sale completed)
  - **Acceptance:** No custom order missing from queue

### Module S2-M14 verification

- [ ] Inventory custom order appears in karegar queue
- [ ] External custom order appears in karegar queue
- [ ] Assign karegar persists
- [ ] Status flow to COMPLETE works
- [ ] Close sale blocked until COMPLETE
- [ ] Karegar Expense via expenses module updates karegar detail + order paid totals

---

## Module S2-M15 — Integration & QA

**Goal:** End-to-end coherence across all Stage 2 modules.  
**Depends on:** S2-M9 through S2-M14  
**Estimate:** 1–2 days

### Tasks

- [ ] **S2-M15.1** — End-to-end: inventory custom order flow
  - Create → karegar → complete → close → dashboard metrics
  - **Acceptance:** All numbers consistent

- [ ] **S2-M15.2** — End-to-end: external custom order flow
  - Not in inventory → karegar → expense → close
  - **Acceptance:** Profit uses manualCost

- [ ] **S2-M15.3** — End-to-end: beopari purchase + Beopari expense payment
  - **Acceptance:** Cash in hand + expense + beopari remaining sync (single and multi-purchase)

- [ ] **S2-M15.4** — Customer history shows all order types
  - **Acceptance:** Mixed inventory + external history

- [ ] **S2-M15.5** — Dashboard cards audit
  - **Acceptance:** Revenue, net profit, cash in hand formulas documented and correct

- [ ] **S2-M15.6** — Auth permissions review
  - Expenses/beopari/karegar: admin vs staff roles (match existing patterns)
  - **Acceptance:** Unauthorized users blocked

- [ ] **S2-M15.7** — Update modules.md status header
  - **Files:** `modules.md` — add pointer to Stage 2 docs
  - **Acceptance:** Docs cross-linked

- [ ] **S2-M15.8** — `npm run build` + smoke test all new routes
  - **Acceptance:** Build passes; no broken nav links

### Module S2-M15 verification

- [ ] Full regression Stage 1 + Stage 2
- [ ] Client demo script prepared (see implementation_stage2.md §15)

---

## Summary: New files checklist

### API routes (new)

```
app/api/expenses/route.ts
app/api/expenses/[id]/route.ts
app/api/beopari/route.ts
app/api/beopari/[id]/route.ts
app/api/beopari/[id]/purchases/route.ts
app/api/beopari/purchases/[id]/route.ts
app/api/karegar/route.ts
app/api/karegar/[id]/route.ts
app/api/workshop-orders/route.ts
app/api/workshop-orders/[id]/route.ts
app/api/customers/[id]/purchases/route.ts  (optional)
```

### Pages (new)

```
app/dashboard/customers/[id]/page.tsx
app/dashboard/expenses/page.tsx
app/dashboard/expenses/new/page.tsx
app/dashboard/expenses/[id]/page.tsx
app/dashboard/beopari/page.tsx
app/dashboard/beopari/[id]/page.tsx
app/dashboard/beopari/[id]/purchases/new/page.tsx
app/dashboard/karegar/page.tsx
app/dashboard/karegar/workers/new/page.tsx
app/dashboard/karegar/workers/[id]/page.tsx
```

### Libraries (new)

```
lib/sale-summary-utils.ts
lib/cash-utils.ts
lib/expense-utils.ts
lib/beopari-utils.ts
lib/workshop-utils.ts
```

### Components (expenses — new)

```
components/expenses/expense-allocation-fields.tsx
```

---

## Total estimate

| Module | Estimate |
|--------|----------|
| S2-M9 Dashboard | 0.5–1 day |
| S2-M10 Customers | 1 day |
| S2-M11 Sales dual mode | 2–3 days |
| S2-M12 Expenses | 2 days |
| S2-M13 Beopari | 2–3 days |
| S2-M14 Karegar | 2–3 days |
| S2-M15 QA | 1–2 days |
| **Total** | **~11–15 days** |

---

*End of Stage 2 module task breakdown.*
