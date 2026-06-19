-- CreateTable
CREATE TABLE "beopari_purchase_items" (
    "id" TEXT NOT NULL,
    "purchase_id" TEXT NOT NULL,
    "category_id" TEXT,
    "category_name" TEXT NOT NULL,
    "total_weight" DECIMAL(10,3) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "cost_per_gram" DECIMAL(10,2) NOT NULL,
    "line_total" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "beopari_purchase_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "beopari_purchase_items_purchase_id_idx" ON "beopari_purchase_items"("purchase_id");

-- AddForeignKey
ALTER TABLE "beopari_purchase_items" ADD CONSTRAINT "beopari_purchase_items_purchase_id_fkey" FOREIGN KEY ("purchase_id") REFERENCES "beopari_purchases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beopari_purchase_items" ADD CONSTRAINT "beopari_purchase_items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill one line item per existing purchase
INSERT INTO "beopari_purchase_items" (
    "id",
    "purchase_id",
    "category_id",
    "category_name",
    "total_weight",
    "quantity",
    "cost_per_gram",
    "line_total"
)
SELECT
    gen_random_uuid()::text,
    "id",
    "category_id",
    "category_name",
    "total_weight",
    "quantity",
    "cost_per_gram",
    "total_cost"
FROM "beopari_purchases";
