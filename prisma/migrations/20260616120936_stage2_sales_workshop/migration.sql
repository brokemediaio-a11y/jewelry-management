-- CreateEnum
CREATE TYPE "SaleSource" AS ENUM ('INVENTORY', 'EXTERNAL');

-- CreateEnum
CREATE TYPE "WorkshopOrderStatus" AS ENUM ('SENT_TO_WORKSHOP', 'IN_PROGRESS', 'COMPLETE');

-- AlterTable
ALTER TABLE "sale_items" ADD COLUMN     "category_name" TEXT,
ALTER COLUMN "inventory_item_id" DROP NOT NULL,
ALTER COLUMN "item_quality" DROP DEFAULT;

-- AlterTable
ALTER TABLE "sales" ADD COLUMN     "manual_cost" DECIMAL(10,2),
ADD COLUMN     "order_description" TEXT,
ADD COLUMN     "sample_image_data" TEXT,
ADD COLUMN     "sample_image_mime_type" TEXT,
ADD COLUMN     "source" "SaleSource" NOT NULL DEFAULT 'INVENTORY';

-- CreateTable
CREATE TABLE "karegars" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "karegars_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workshop_orders" (
    "id" TEXT NOT NULL,
    "sale_id" TEXT NOT NULL,
    "karegar_id" TEXT,
    "status" "WorkshopOrderStatus" NOT NULL DEFAULT 'SENT_TO_WORKSHOP',
    "assigned_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workshop_orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "workshop_orders_sale_id_key" ON "workshop_orders"("sale_id");

-- CreateIndex
CREATE INDEX "workshop_orders_status_idx" ON "workshop_orders"("status");

-- CreateIndex
CREATE INDEX "workshop_orders_karegar_id_idx" ON "workshop_orders"("karegar_id");

-- CreateIndex
CREATE INDEX "sales_source_idx" ON "sales"("source");

-- AddForeignKey
ALTER TABLE "workshop_orders" ADD CONSTRAINT "workshop_orders_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workshop_orders" ADD CONSTRAINT "workshop_orders_karegar_id_fkey" FOREIGN KEY ("karegar_id") REFERENCES "karegars"("id") ON DELETE SET NULL ON UPDATE CASCADE;
