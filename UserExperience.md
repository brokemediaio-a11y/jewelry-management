# Venus Silver Collection — User Experience Enhancement Plan

> **Status:** Approved — Phases 1–2 complete, Phase 3 complete  
> **Scope:** Every module, page, table, button, and card  
> **Audience:** Shop staff (clerks), owner/manager, accountant — daily counter use  
> **Last reviewed:** June 18, 2026

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [UX Principles for This Product](#2-ux-principles-for-this-product)
3. [Global Shell — Sidebar, Navbar, Layout](#3-global-shell--sidebar-navbar-layout)
4. [Authentication — Login](#4-authentication--login)
5. [Module: Dashboard](#5-module-dashboard)
6. [Module: Sales](#6-module-sales)
7. [Module: Expenses](#7-module-expenses)
8. [Module: Reports](#8-module-reports)
9. [Module: Beopari](#9-module-beopari)
10. [Module: Karegar (Workshop)](#10-module-karegar-workshop)
11. [Module: Inventory](#11-module-inventory)
12. [Module: Categories](#12-module-categories)
13. [Module: Stones](#13-module-stones)
14. [Module: Customers](#14-module-customers)
15. [Module: Settings](#15-module-settings)
16. [Cross-Cutting Improvements](#16-cross-cutting-improvements)
17. [Recommended Implementation Phases](#17-recommended-implementation-phases)

---

## 1. Executive Summary

The app is functionally complete but optimized for developers, not daily shop operators. The biggest UX gaps:

| Gap | Impact |
|-----|--------|
| **Technical labels everywhere** (`COMPLETED`, `BEOPARI`, `SENT_TO_WORKSHOP`) | Staff must mentally translate enums |
| **Icon-only actions without labels or tooltips** | Eye / Trash / Pencil buttons are ambiguous |
| **Overloaded page headers** (5–8 buttons on Inventory/Sales) | Secondary actions compete with primary workflow |
| **Non-functional global search** | Navbar promises search that does not exist |
| **Inconsistent table column order** | Date vs invoice order differs across pages |
| **Wide tables without scroll affordance** | Inventory and workshop queue overflow on laptops |
| **Duplicate silver-rate controls** | Dashboard card + Settings tab + inline sale text |
| **Weak empty/loading states** | Plain "Loading..." — missed onboarding moments |
| **Destructive actions via `confirm()` / `alert()`** | Inconsistent with dialog-based UI elsewhere |

This plan reorganizes layout, labels, and action hierarchy **page by page** so a clerk can sell, record expenses, and check workshop status without learning internal terminology.

---

## 2. UX Principles for This Product

Apply these on every page during implementation:

1. **Counter-first** — Sales and workshop queue are highest-frequency flows; they get the fastest paths and largest touch targets.
2. **Human language over database enums** — Show "Completed", "Custom Order", "Beopari Payment", "Sent to Workshop". **Keep client terms:** **Beopari** (vendor) and **Karegar** (worker) — do not translate these.
3. **One primary action per screen region** — Header gets one filled button; rest is outline, ghost, or a "More" menu -menu.
4. **Scannable tables** — Date first, money right-aligned, status as colored badge with readable text, long text truncated with tooltip.
5. **Context stays visible** — Silver rate and open custom orders reachable from any page (navbar strip).
6. **Progressive disclosure** — Hide pricing math (quotient, silver @ purchase) behind "Details" unless expanded.
7. **Forgiving inputs** — SKU field auto-focus; barcode field clears after success; warn before leaving unsaved forms.
8. **Consistent back navigation** — Back arrow + breadcrumb on every nested route (`Sales › INV-20260618-0001`).

---

## 3. Global Shell — Sidebar, Navbar, Layout

### Current state

**Sidebar** (`components/dashboard/sidebar.tsx`)

| Nav item | Route |
|----------|-------|
| Dashboard | `/dashboard` |
| Sales | `/dashboard/sales` |
| Expenses | `/dashboard/expenses` |
| Reports | `/dashboard/reports` |
| Beopari | `/dashboard/beopari` |
| Karegar | `/dashboard/karegar` |
| Inventory | `/dashboard/inventory` |
| Categories | `/dashboard/categories` |
| Stones | `/dashboard/stones` |
| Customers | `/dashboard/customers` |
| Settings | `/dashboard/settings` |

Flat list — operational and setup modules mixed. Mobile uses hamburger sheet.

**Navbar** (`components/dashboard/navbar.tsx`)

| Element | Current behavior |
|---------|------------------|
| Search input | Placeholder "Search products, customers..." — **not wired** |
| Bell icon | **Not wired** |
| User name + Logout | Works on desktop |
| Logout icon | Mobile only |

**Layout** (`app/dashboard/layout.tsx`) — Silver rate fetched globally; main content scrolls.

### Recommended changes

#### Sidebar — grouped navigation

```
OPERATIONS
  Dashboard
  New Sale              ← direct shortcut (most common action)
  Sales
  Karegar
  Expenses

STOCK
  Inventory
  Categories
  Stones

PARTNERS & INSIGHTS
  Beopari
  Customers
  Reports

ADMIN
  Settings
```

- Add muted section headers between groups
- **New Sale** as accent nav item (`+` icon or distinct color)
- Optional phase 2: collapsible icon-only sidebar for wider tables

#### Navbar

| Element | Recommendation |
|---------|------------------|
| Search | **Phase 1:** Remove or show disabled + "Coming soon". **Phase 2:** Unified search → customers (name/phone), inventory (SKU/barcode), sales (invoice #) |
| Bell | **Phase 1:** Remove. **Phase 2:** Alerts for custom orders due today, workshop stuck > 7 days, beopari balances overdue |
| Silver rate pill | Add compact read-only: `Silver: Rs. 601.17/g` → Settings › Silver Rate; lock icon when session override active |
| Cash in hand pill | Optional for admin: `Cash: Rs. X` → cash-position report |
| User block_q
Dropdown: name, role badge, Settings, Logout |

#### Layout

- Full-width on table/POS pages; max-width on simple forms
- Sticky breadcrumb bar below navbar on nested routes
- Global toast system (replace inline success text and `alert()`)

---

## 4. Authentication — Login

**Route:** `/login` · **File:** `app/login/page.tsx`

### Current elements

| Element | Behavior |
|---------|----------|
| Card title | "Venus Silver Collection" |
| Email | Required; placeholder `admin@venus.com` |
| Password | Required |
| Sign In | Full width; "Signing in..." while loading |
| Error | Red text above form |

### UX issues

- Logo added at `public/venus_logo.png` — use on login, sidebar, and print headers
- Placeholder exposes seed admin email
- No show/hide password
- All roles land on dashboard after login

### Recommended changes

1. Shop logo / name from Settings
2. Generic email placeholder (`you@shop.com`)
3. Show/hide password toggle
4. Role-based redirect: clerk → `/dashboard/sales/new`, admin → `/dashboard`
5. Friendly error copy: *"Email or password didn't match."*
6. Optional "Remember this device" for counter PC

---

## 5. Module: Dashboard

**Route:** `/dashboard` · **File:** `app/dashboard/page.tsx`

### Current layout (top → bottom)

1. **Header** — title; buttons: `Financial report` (outline), `New Sale` (primary)
2. **Open custom orders alert** (conditional; links to Sales)
3. **KPI grid** (6 cards on XL): Available Inventory, Sales This Month, Revenue, Net Profit, Cash in Hand, Open Custom Orders
4. **Today's Silver Rate** card
5. **Recent Sales** table

### KPI cards — element by element

| Card | Subtitle today | Issue | Recommendation |
|------|----------------|-------|----------------|
| Available Inventory | "Items in stock" | OK | Click → `/dashboard/inventory?status=AVAILABLE` |
| Sales This Month | "Non-cancelled sales" | Jargon | Subtitle: "Including open orders" |
| Revenue This Month | "Completed sales (PKR)" | OK | Click → sales register report |
| Net Profit | Long formula in subtitle | Too technical | Subtitle: "After costs & expenses"; formula in `(i)` tooltip |
| Cash in Hand | Same Wallet icon as Net Profit | Confusing | Use `Banknote` icon; click → cash-position report |
| Open Custom Orders | Duplicates alert banner | Redundant | **Remove card**; keep alert banner only |

**Recommended card order**

- Row 1: Large **Start Sale** CTA, open-orders alert (if any), Cash in Hand
- Row 2: Revenue, Net Profit, Sales count, Available Inventory
- Row 3: Silver Rate (half or full width)

### Recent Sales table

| Column | Recommendation |
|--------|----------------|
| Date | First column; `DD MMM YYYY`; time for today |
| Invoice | Mono; link to sale detail |
| Customer | Link to customer profile |
| Items Summary | Tooltip on hover; suffix `(N items)` — drop separate Items column |
| Status | Human label + color badge |
| Total | Right-align, bold, tabular numbers |
| Actions | "View" text on sm+; not icon-only |

**Add (optional):** Type badge (Walk-in / Custom), Source (Stock / Sample)

### Header buttons

| Button | Recommendation |
|--------|----------------|
| Financial report | Move to dashboard footer links or Net Profit card drill-down |
| New Sale | **Keep as sole primary header action** |
| View all (recent sales) | Keep in table card header |

---

## 6. Module: Sales

### 6.1 Sales List

**Route:** `/dashboard/sales` · **File:** `app/dashboard/sales/page.tsx`

#### Header buttons

| Button | Recommendation |
|--------|----------------|
| Export sales | Move to filter bar or `⋮` More menu |
| Sales margin | Same |
| **New Sale** | **Only primary button in header** |

#### Filters

| Control | Options | Recommendation |
|---------|---------|----------------|
| Sale type | Purchase / Custom Order | Rename: **From Stock** / **Custom Order** |
| Status | Completed / Open / Cancelled | Human labels in filter and table |
| *(missing)* | — | Add date range, customer search, source filter |

#### Sales List table

**Recommended column order:** Date → Invoice → Customer → Type → Items → Status → Final Total → Actions

| Column | Notes |
|--------|-------|
| Date | Always first across app |
| Invoice | Mono; clickable |
| Customer | Link to profile |
| Type | Badge |
| Items | Count |
| Status | Colored badge + readable text |
| Final Total | Right-align |
| Actions | View (+ Print in overflow) |

- **Row click** → sale detail (not only eye icon)
- **Empty state:** illustration + "Start your first sale" → New Sale
- **Pagination:** show "1–20 of 156"; page size 10/20/50

---

### 6.2 New Sale (POS)

**Route:** `/dashboard/sales/new` (+ `?mode=external`)

#### Header & mode switch

| Element | Recommendation |
|---------|----------------|
| Back arrow | → Sales list |
| Title | "New Sale" |
| `SaleModeSwitch` | Full width under title |

**Helper copy under modes:**

- *In Inventory:* "Scan or enter SKU for items already in stock"
- *Not in Inventory:* "Custom order from customer sample — no SKU yet"

#### Mode A: In Inventory (2-column layout)

**Recommended structure:**

```
┌──────────────────────────────────────────────────────────────┐
│ Mode switch                          Silver: Rs. X/g (edit)  │
├─────────────────────────────┬────────────────────────────────┤
│ ADD ITEMS                   │ CHECKOUT (sticky desktop)    │
│ [SKU — AUTO FOCUS]          │ Customer *                   │
│ [Camera scanner — collapsed]│ Sale type · Payment · Notes  │
│ CART + item cards           │ Suggested / Final (large)    │
│                             │ [ Complete Sale ] sticky     │
└─────────────────────────────┴────────────────────────────────┘
```

##### Add Items card

| Element | Recommendation |
|---------|----------------|
| SKU input (`SkuInput`) | Auto-focus on load; clear after add; subtle success flash |
| Barcode scanner | Collapsed by default; "Open camera" — USB wedge is primary |
| Lookup errors | Inline alert; auto-dismiss 5s |
| Silver rate in card description | Move to top bar |

##### Cart (`SaleCart` + `CartItemCard`)

| Element | Recommendation |
|---------|----------------|
| Clear Cart | Confirm dialog |
| Empty state | Illustration + hint to scan SKU |
| Item pricing grid (4 lines) | Collapse under "Pricing details" |
| Final price input | Optional quick actions: "Use suggested" |
| Remove (X) | Tooltip "Remove from cart" |

##### Checkout (`PricingPanel`)

| Field | Recommendation |
|-------|----------------|
| Customer * | Required; quick-add walk-in customer |
| Sale type | Rename options; show advance/pickup when Custom |
| Payment method | Default CASH; common methods first |
| Notes | Optional |
| Complete Sale | Label → "Create Custom Order" when applicable; disabled states explained inline |

**Mobile:** Sticky bottom bar with final total → opens full-screen checkout sheet

#### Mode B: External order (`ExternalOrderForm`)

| Field | Recommendation |
|-------|----------------|
| Sample image | Larger preview |
| Description | Character count (min 10) |
| Final price / Advance | Side-by-side; live Remaining |
| Pickup date | Default +7 days |
| Submit | Sticky "Create Custom Order" |

Use same 2-column layout as inventory mode (form left, order summary right).

---

### 6.3 Sale Detail / Invoice

**Route:** `/dashboard/sales/[id]`

#### Header actions

| Button | Recommendation |
|--------|----------------|
| Back | + breadcrumb |
| Print | Primary for reprints |
| PDF | Under Print ▾ dropdown |
| Close Sale | When disabled: show reason + link to Karegar queue |
| Cancel Sale | Proper dialog (not `confirm()`); explain inventory release |

#### Workshop banner (`WorkshopStatusBanner`)

- Keep above invoice
- Quick actions: assign karegar, mark complete (with permission)
- Link to filtered Karegar queue

#### Invoice body

| Section | Recommendation |
|---------|----------------|
| Partial payment banner | Keep; show remaining amount prominently |
| Customer | `tel:` link on phone |
| Items table | Hide Quality/Stone on print; toggle "Show details" on screen |
| External order | Larger sample image |
| Totals | Merge custom-order advance/remaining into totals block (fewer cards) |

**Items table (on screen):** Item, SKU, Category, Weight, Suggested, Final — Quality/Stone in expanded detail.

---

## 7. Module: Expenses

### 7.1 Expenses List

**Route:** `/dashboard/expenses`

#### Header

| Button | Recommendation |
|--------|----------------|
| Export expenses | Filter row or More menu |
| **Add Expense** | Primary |

**Add quick-add chips:** `+ Shop`, `+ Home`, `+ Beopari payment`, `+ Karegar payment` (pre-fill type on new form)

#### Filters

| Filter | Recommendation |
|--------|----------------|
| Type | Human labels: Beopari, Karegar, Shop, Home |
| Date range | Add "This month" chip |

#### Expenses table (`ExpenseTable`)

| Column | Recommendation |
|--------|----------------|
| Date | 1 |
| Type | Color-coded badge (not raw enum) |
| Payee / Description | Wider; tooltip; link to Beopari/Karegar when applicable |
| Amount | Bold, right-align |
| Method | Human label |
| View | Row click → detail |

**Add:** Filtered period total above table: `Total: Rs. X`

---

### 7.2 New Expense

**Route:** `/dashboard/expenses/new`

#### Form field order (`ExpenseForm`)

1. Type — **segmented control** with icons (not dropdown)
2. Amount — large, PKR prefix
3. Date — default today
4. Payment method — default CASH
5. Type-specific: Beopari/Karegar allocations OR Shop/Home description (required, min 10 chars)
6. Submit — "Record Expense"

- Show allocation sum vs amount with green check when balanced
- Back link to list
- After save: toast + "Record another"

---

### 7.3 Expense Detail

**Route:** `/dashboard/expenses/[id]`

| Element | Recommendation |
|---------|----------------|
| Back | Breadcrumb: Expenses › Detail |
| Edit | Clear "Editing" mode banner |
| Delete | Delete dialog (not `confirm()`) |
| Read view | Show allocation sub-table; link payees; add title "Expense — Rs. X" |

---

## 8. Module: Reports

### 8.1 Reports Hub

**Route:** `/dashboard/reports`

#### Quick exports (11 outline buttons)

- Group by category with subheadings
- Rename to full labels: "Profit & Loss (this month)"
- Add search across report titles

#### Report cards (by category)

| Element | Keep / change |
|---------|----------------|
| CSV / PDF / Excel badges | Keep |
| Description | Keep |
| Open report | Keep full-width primary on card |

---

### 8.2 Report Viewer

**Route:** `/dashboard/reports/[reportId]` · **Component:** `ReportViewer`

| Element | Recommendation |
|---------|----------------|
| Back | Breadcrumb: Reports › {title} |
| Filters | Auto-apply preset periods; manual Apply for custom range |
| Export CSV/PDF/Excel | Single **Export ▾** dropdown |
| KPI strip | Sticky while scrolling |
| Preview table | Sticky header; zebra rows; right-align numbers |
| Empty | "No data for this period" + widen dates hint |

---

## 9. Module: Beopari

> **Client terminology:** Always use **Beopari** (not "Supplier" or "Vendor") in UI labels, buttons, and navigation.

### 9.1 Beopari List

**Route:** `/dashboard/beopari`

#### Header

| Button | Recommendation |
|--------|----------------|
| **Add Beopari** | Primary |
| *(add)* | Beopari Summary report (outline) |
| *(add)* | Search by name |

#### Beopari table (`BeopariTable`)

| Column | Recommendation |
|--------|----------------|
| Name | Row click → detail |
| Business Start | OK |
| Total / Paid / Remaining | Right-align; **Remaining highlighted if > 0** |
| View | "Open ledger" text, not icon-only |

Default sort: remaining balance descending.

---

### 9.2 Beopari Detail

**Route:** `/dashboard/beopari/[id]`

#### Header buttons

| Button | Recommendation |
|--------|----------------|
| Beopari statement | Outline |
| Record Payment | **Primary when remaining > 0** |
| New Purchase | Primary otherwise |

#### Summary

Replace inline text with **three mini KPI cards**: Total · Paid · Remaining

#### Purchases table

| Column | Recommendation |
|--------|----------------|
| Date, Category, Weight, Qty, Cost/g, Total, Paid, Remaining | Keep |
| Actions | **Pay** on rows with remaining → expense form pre-filled |

#### Payment history table

Link amounts/descriptions → expense detail.

**Add:** Back to Beopari list.

---

### 9.3 New Beopari / New Purchase

**Routes:** `/dashboard/beopari/new`, `/dashboard/beopari/purchases/new`

- Breadcrumb: Beopari › New Beopari / New Purchase
- Live total calc prominent on purchase form
- After save: optional "Record payment now?" if balance owed

---

## 10. Module: Karegar (Workshop)

> **Client terminology:** Always use **Karegar** (not "Worker" or "Artisan") in UI labels, buttons, and navigation.

### 10.1 Karegar Main Page

**Route:** `/dashboard/karegar`

Two sections today: **Workshop queue** + **Karegars list**.

**Recommendation:** Tabs — **Workshop Queue** | **Karegars** (reduce scroll)

#### Header

| Button | Recommendation |
|--------|----------------|
| Workshop report | More menu |
| Add Karegar | Secondary; queue is primary |

#### Queue filters

| Filter | Recommendation |
|--------|----------------|
| Status | Default: hide Complete (toggle "Show completed") |
| Karegar, dates | Keep |

#### Workshop queue table (`WorkshopQueueTable`)

| Column | Recommendation |
|--------|----------------|
| Date | OK |
| Invoice | Link to sale |
| Customer | OK |
| Source | "From stock" / "Sample order" |
| Description | Tooltip |
| **Pickup date** | **Add** — prioritize overdue |
| Assigned To | Confirm on change; unassigned = amber row |
| Status | Color-coded row; toast on invalid transition |
| Sale action | "Invoice" link, not badge-only |

Phase 2: bulk assign to karegar.

#### Karegars table

| Column | Recommendation |
|--------|----------------|
| Name | Link to detail |
| Phone | `tel:` link |
| Status | Active/Inactive badge |
| Open jobs | **Add count** |
| View | Keep |

---

### 10.2 Karegar Worker Detail

**Route:** `/dashboard/karegar/workers/[id]`

| Element | Recommendation |
|---------|----------------|
| Record Payment | Primary |
| Payment report | Outline |
| Payment history table | Link rows → expense detail |
| *(add)* | Tab or section: **Assigned orders** (open workshop jobs) |
| *(add)* | Edit worker / deactivate |

---

### 10.3 New Karegar

**Route:** `/dashboard/karegar/workers/new`

- Standard form page with back + breadcrumb
- After create → "Add another" or return to queue

---

## 11. Module: Inventory

### 11.1 Inventory List

**Route:** `/dashboard/inventory`

#### Header buttons (currently 6 — too many)

| Button | Recommendation |
|--------|----------------|
| Stock report | **More ▾** menu |
| Valuation | More menu |
| Aging stock | More menu |
| Print All Barcodes | Outline in header |
| **Add Inventory** | **Primary only** |

#### Filters

| Control | Recommendation |
|---------|----------------|
| Search SKU/barcode | Keep; also search barcode in same field |
| Category, Status | Keep |
| *(add)* | Quality filter (Premium / Local) |

#### Inventory table (`InventoryTable`)

**Problem:** 12 columns — horizontal overflow.

**Default visible columns:** Image, SKU, Category, Weight, Purchase/Piece, Status, Actions

**"Show more" toggle reveals:** Barcode, Quality, Stone, Silver Rate, Date

| Actions column | Recommendation |
|----------------|----------------|
| View (eye) | Tooltip + row click |
| Print barcode | Keep |
| Delete | Only AVAILABLE; tooltip |

- Horizontal scroll with shadow hint on overflow
- Empty state → Add Inventory CTA

---

### 11.2 Add Inventory

**Route:** `/dashboard/inventory/new` · **Form:** `InventoryForm`

#### Recommended field order (match business workflow)

1. **Photo** (required) — large drop zone
2. **Category**
3. **Weight (g)**
4. **Quality** (Premium / Local) — affects price; place early
5. **Stone configuration** toggle → type, color, cut, clarity, price
6. **Silver rate today** (editable, with date label)
7. **Quantity**
8. **Purchase price per gram** → auto **per piece**
9. **SKU / barcode preview** (read-only footer)

| Button | Recommendation |
|--------|----------------|
| Submit | "Add to inventory" |
| Cancel | Back link |

Show success toast with SKU list when quantity > 1.

---

### 11.3 Inventory Detail

**Route:** `/dashboard/inventory/[id]` · **Component:** `InventoryDetail`

| Section | Recommendation |
|---------|----------------|
| Image card | Larger image; zoom on click |
| Details card | Group: Identity (SKU, barcode) · Physical · Pricing · Status |
| Barcode preview | Keep + **Print barcode** button |
| Sale history | Link to invoice if SOLD/RESERVED |
| Delete | Only if AVAILABLE; dialog |

**Add actions in header:** Print barcode, **Sell this item** → New Sale with SKU pre-filled lookup

---

### 11.4 Barcode Print Pages

**Routes:** `/dashboard/inventory/[id]/barcode`, `/dashboard/inventory/print-barcodes`

| Element | Recommendation |
|---------|----------------|
| Print button | Sticky top on screen; hidden in `@media print` |
| Back | Keep |
| Bulk print | Confirm count: "Print 47 labels?" |
| Preview | Show grid before print |

---

## 12. Module: Categories

**Route:** `/dashboard/categories`

#### Header

| Button | Recommendation |
|--------|----------------|
| **Add Category** | Primary |

#### Categories table

| Column | Recommendation |
|--------|----------------|
| Name | Bold |
| Description | Truncate + tooltip |
| Items | Link → inventory filtered by category |
| Created | Hide on mobile |
| Edit / Delete | Icon + tooltip; delete blocked message if items > 0 |

#### Add/Edit dialog (`CategoryForm`)

- Keep dialog pattern (simple CRUD)
- Show warning on edit if category has many items

---

## 13. Module: Stones

**Route:** `/dashboard/stones`

Single card with tabs: Type · Color · Cut · Clarity (`StoneOptionsPanel` each)

| Element | Recommendation |
|---------|----------------|
| Tabs | Keep — good progressive disclosure |
| Each panel | Search/filter within long lists |
| Add option | Inline or dialog — keep |
| Delete | Dialog with warning if used in inventory |

**Add header link:** "Used in inventory" count per option (phase 2)

Setup/admin module — lower traffic; no structural change needed beyond search and empty states.

---

## 14. Module: Customers

### 14.1 Customers List

**Route:** `/dashboard/customers`

#### Header

| Button | Recommendation |
|--------|----------------|
| Top customers report | More menu |
| Customer summary report | More menu |
| **Add Customer** | Primary |

#### Customers table (`CustomerTable`)

| Column | Recommendation |
|--------|----------------|
| Name | Link to detail (row click) |
| Phone | `tel:` link |
| Email | `mailto:` link |
| **Purchases** | **Add** count column |
| Actions | View primary; Edit/Delete in overflow |

Client-side search only (limit 100) — add server search if list grows.

---

### 14.2 Customer Detail

**Route:** `/dashboard/customers/[id]`

| Element | Issue | Recommendation |
|---------|-------|----------------|
| Back | Icon only | Breadcrumb |
| Customer statement | Top right | Keep |
| Edit | Redirects to list | **Inline edit dialog** on this page |
| Delete | `confirm()` | Delete dialog |
| Header | Split layout awkward | Full-width header card with contact info |

#### Purchase history table (`CustomerPurchaseHistory`)

Same column order as Sales list: Date → Invoice → Type → Source → Items → Total → Paid → Status → View

| Column | Recommendation |
|--------|----------------|
| Source | Human labels |
| Paid | Clear logic for open custom orders |
| Status | Colored badge |

**Add summary above table:** Total spent, open orders count.

---

## 15. Module: Settings

**Route:** `/dashboard/settings`

Tabs: **Shop Information** · **Silver Rate** · **Pricing**

### Shop Information (`SettingsShopInfo`)

| Field | Recommendation |
|-------|----------------|
| Name, address, phone, email | Keep |
| Save | Toast on success |

Used on printed invoices — add note: "Appears on customer invoices"

### Silver Rate (`SettingsRates`)

| Element | Issue | Recommendation |
|---------|-------|----------------|
| Read-only rate + Refresh | OK | |
| Overlap with dashboard card | Duplicate UX | Dashboard = quick session edit; Settings = admin refresh from API + explanation |
| Session override | Explained on dashboard | Repeat short note here |

### Pricing (`SettingsPricing`)

| Element | Recommendation |
|---------|----------------|
| Formula editor | Keep for admin |
| Quality quotients | Plain-language labels |
| Warning | "Changes affect new sales immediately" |

**Add tab (phase 2):** Users & roles if user management UI is exposed.

---

## 16. Cross-Cutting Improvements

### 16.1 Label dictionary (apply app-wide)

| Enum | Display |
|------|---------|
| `COMPLETED` | Completed |
| `OPEN` | Open |
| `CANCELLED` | Cancelled |
| `PURCHASE` | From Stock |
| `CUSTOM_ORDER` | Custom Order |
| `INVENTORY` / `EXTERNAL` | From Stock / Sample Order |
| `AVAILABLE` / `SOLD` / `RESERVED` | Available / Sold / Reserved |
| `PREMIUM` / `LOCAL` | Premium / Local |
| `BEOPARI` / `KAREGAR` / `SHOP` / `HOME` | Beopari / Karegar / Shop / Home |
| `SENT_TO_WORKSHOP` | Sent to Workshop |
| `IN_PROGRESS` | In Progress |
| `COMPLETE` | Complete |
| Payment methods | Cash, Card, UPI, Bank Transfer, Cheque |

Centralize in `lib/display-labels.ts` (or similar).

### 16.2 Tables

- Sticky header on scroll
- `tabular-nums` for money columns
- Consistent **Date first** column
- Row hover state + pointer when clickable
- Responsive: priority columns + horizontal scroll with fade edge

### 16.3 Buttons & actions

- Icon-only → add `Tooltip` + `aria-label`
- Destructive → always dialog, never `confirm()` / `alert()`
- Primary hierarchy: 1 filled per viewport region

### 16.4 Loading & empty states

- Skeleton loaders for tables and cards (component exists: `Skeleton`)
- Empty states: icon + one sentence + primary CTA

### 16.5 Feedback

- Toast for save/delete/export success
- Inline field errors on forms (already via react-hook-form on many forms)

### 16.6 Accessibility & i18n readiness

- Focus management in dialogs
- Keyboard: Enter on SKU field submits lookup
- Urdu/English phase 2: avoid hardcoding in components; use label map

---

## 17. Recommended Implementation Phases

### Phase 1 — High impact, low risk (1–2 weeks)

- Human-readable labels app-wide
- Tooltips on all icon buttons
- Sidebar grouping + New Sale shortcut
- Remove or disable dead navbar search/bell
- Navbar silver rate pill
- Dashboard KPI reorder + remove duplicate Open Orders card
- Sales list column order + row click
- New Sale SKU auto-focus + checkout sticky on desktop
- Replace `confirm()` / `alert()` with dialogs
- Skeleton loaders + empty states on main tables
- Breadcrumbs on detail pages

### Phase 2 — Layout & workflow (2–3 weeks) ✅ Complete

- Inventory table column sets + More menu on list headers
- Expense type segmented control + quick-add chips
- Karegar tabs + pickup date column + default hide complete
- Customer detail inline edit
- Beopari KPI mini-cards + Pay action on purchases
- Report Export dropdown + filter auto-apply
- Global toast system
- Sell-from-inventory shortcut (`?sku=` on New Sale + table/detail actions)

### Phase 3 — Power features (3+ weeks) ✅ Complete

- Unified global search (navbar — customers, SKU/barcode, invoice #)
- Notification bell (custom orders due today, workshop stuck > 7 days, beopari balances)
- Mobile POS checkout bottom sheet on New Sale
- Favorites / recent reports on Reports hub
- Bulk workshop assign (Karegar queue)
- Role-based login redirect and navbar cash pill (admin/accountant)

---

## Approval checklist

Before implementation, confirm:

- [ ] Sidebar grouping and **New Sale** as top-level nav item
- [ ] Label dictionary (enum → human text)
- [ ] Remove Open Custom Orders KPI card (keep banner only)
- [ ] Sales / dashboard / customer tables: **Date first**
- [ ] Inventory default columns vs "Show more"
- [ ] Phase 1 scope vs full three-phase plan

---

*End of UserExperience.md*
