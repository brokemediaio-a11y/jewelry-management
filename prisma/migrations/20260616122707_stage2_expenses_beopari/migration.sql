-- CreateEnum
CREATE TYPE "ExpenseType" AS ENUM ('BEOPARI', 'KAREGAR', 'SHOP', 'HOME');

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "expense_type" "ExpenseType" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "expense_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,
    "payment_method" "PaymentMethod" NOT NULL DEFAULT 'CASH',
    "user_id" TEXT NOT NULL,
    "beopari_id" TEXT,
    "karegar_id" TEXT,
    "sale_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_beopari_allocations" (
    "id" TEXT NOT NULL,
    "expense_id" TEXT NOT NULL,
    "beopari_purchase_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "expense_beopari_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_workshop_allocations" (
    "id" TEXT NOT NULL,
    "expense_id" TEXT NOT NULL,
    "workshop_order_id" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "expense_workshop_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beoparis" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "business_start_date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "beoparis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beopari_purchases" (
    "id" TEXT NOT NULL,
    "beopari_id" TEXT NOT NULL,
    "category_id" TEXT,
    "category_name" TEXT NOT NULL,
    "total_weight" DECIMAL(10,3) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "cost_per_gram" DECIMAL(10,2) NOT NULL,
    "total_cost" DECIMAL(10,2) NOT NULL,
    "purchase_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "beopari_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "expenses_expense_type_idx" ON "expenses"("expense_type");

-- CreateIndex
CREATE INDEX "expenses_expense_date_idx" ON "expenses"("expense_date");

-- CreateIndex
CREATE INDEX "expenses_beopari_id_idx" ON "expenses"("beopari_id");

-- CreateIndex
CREATE INDEX "expenses_karegar_id_idx" ON "expenses"("karegar_id");

-- CreateIndex
CREATE INDEX "expense_beopari_allocations_beopari_purchase_id_idx" ON "expense_beopari_allocations"("beopari_purchase_id");

-- CreateIndex
CREATE UNIQUE INDEX "expense_beopari_allocations_expense_id_beopari_purchase_id_key" ON "expense_beopari_allocations"("expense_id", "beopari_purchase_id");

-- CreateIndex
CREATE INDEX "expense_workshop_allocations_workshop_order_id_idx" ON "expense_workshop_allocations"("workshop_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "expense_workshop_allocations_expense_id_workshop_order_id_key" ON "expense_workshop_allocations"("expense_id", "workshop_order_id");

-- CreateIndex
CREATE INDEX "beopari_purchases_beopari_id_idx" ON "beopari_purchases"("beopari_id");

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_beopari_id_fkey" FOREIGN KEY ("beopari_id") REFERENCES "beoparis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_karegar_id_fkey" FOREIGN KEY ("karegar_id") REFERENCES "karegars"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_beopari_allocations" ADD CONSTRAINT "expense_beopari_allocations_expense_id_fkey" FOREIGN KEY ("expense_id") REFERENCES "expenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_beopari_allocations" ADD CONSTRAINT "expense_beopari_allocations_beopari_purchase_id_fkey" FOREIGN KEY ("beopari_purchase_id") REFERENCES "beopari_purchases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_workshop_allocations" ADD CONSTRAINT "expense_workshop_allocations_expense_id_fkey" FOREIGN KEY ("expense_id") REFERENCES "expenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_workshop_allocations" ADD CONSTRAINT "expense_workshop_allocations_workshop_order_id_fkey" FOREIGN KEY ("workshop_order_id") REFERENCES "workshop_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beopari_purchases" ADD CONSTRAINT "beopari_purchases_beopari_id_fkey" FOREIGN KEY ("beopari_id") REFERENCES "beoparis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beopari_purchases" ADD CONSTRAINT "beopari_purchases_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
