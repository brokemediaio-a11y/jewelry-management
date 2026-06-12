/*
  Warnings:

  - You are about to drop the column `price_per_gram` on the `sale_items` table. All the data in the column will be lost.
  - You are about to drop the column `product_id` on the `sale_items` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `sale_items` table. All the data in the column will be lost.
  - You are about to drop the column `total_price` on the `sale_items` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `sale_items` table. All the data in the column will be lost.
  - You are about to drop the column `weight` on the `sale_items` table. All the data in the column will be lost.
  - You are about to drop the column `discount` on the `sales` table. All the data in the column will be lost.
  - You are about to drop the column `final_amount` on the `sales` table. All the data in the column will be lost.
  - You are about to drop the column `total_amount` on the `sales` table. All the data in the column will be lost.
  - You are about to drop the `inventory_entries` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `products` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `category_quotient` to the `sale_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `final_price` to the `sale_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `inventory_item_id` to the `sale_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `purchase_price_per_piece` to the `sale_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `silver_rate_at_purchase` to the `sale_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `silver_rate_at_sale` to the `sale_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `suggested_sale_price` to the `sale_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `weight_grams` to the `sale_items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `final_price` to the `sales` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sale_type` to the `sales` table without a default value. This is not possible if the table is not empty.
  - Added the required column `silver_rate_at_sale` to the `sales` table without a default value. This is not possible if the table is not empty.
  - Added the required column `suggested_sale_price` to the `sales` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SaleType" AS ENUM ('PURCHASE', 'CUSTOM_ORDER');

-- CreateEnum
CREATE TYPE "SaleStatus" AS ENUM ('COMPLETED', 'OPEN', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InventoryStatus" AS ENUM ('AVAILABLE', 'SOLD', 'RESERVED');

-- DropForeignKey
ALTER TABLE "inventory_entries" DROP CONSTRAINT "inventory_entries_product_id_fkey";

-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_category_id_fkey";

-- DropForeignKey
ALTER TABLE "sale_items" DROP CONSTRAINT "sale_items_product_id_fkey";

-- DropIndex
DROP INDEX "sale_items_product_id_idx";

-- AlterTable
ALTER TABLE "sale_items" DROP COLUMN "price_per_gram",
DROP COLUMN "product_id",
DROP COLUMN "quantity",
DROP COLUMN "total_price",
DROP COLUMN "updated_at",
DROP COLUMN "weight",
ADD COLUMN     "category_quotient" DECIMAL(4,2) NOT NULL,
ADD COLUMN     "final_price" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "inventory_item_id" TEXT NOT NULL,
ADD COLUMN     "purchase_price_per_piece" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "silver_rate_at_purchase" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "silver_rate_at_sale" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "suggested_sale_price" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "weight_grams" DECIMAL(10,3) NOT NULL;

-- AlterTable
ALTER TABLE "sales" DROP COLUMN "discount",
DROP COLUMN "final_amount",
DROP COLUMN "total_amount",
ADD COLUMN     "advance_paid" DECIMAL(10,2),
ADD COLUMN     "closed_at" TIMESTAMP(3),
ADD COLUMN     "final_price" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "pickup_date" TIMESTAMP(3),
ADD COLUMN     "remaining_amount" DECIMAL(10,2),
ADD COLUMN     "sale_type" "SaleType" NOT NULL,
ADD COLUMN     "silver_rate_at_sale" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "status" "SaleStatus" NOT NULL DEFAULT 'COMPLETED',
ADD COLUMN     "suggested_sale_price" DECIMAL(10,2) NOT NULL;

-- DropTable
DROP TABLE "inventory_entries";

-- DropTable
DROP TABLE "products";

-- DropEnum
DROP TYPE "InventoryOperationType";

-- DropEnum
DROP TYPE "Material";

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "barcode" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "image_data" TEXT NOT NULL,
    "image_mime_type" TEXT NOT NULL,
    "weight_grams" DECIMAL(10,3) NOT NULL,
    "has_stone" BOOLEAN NOT NULL DEFAULT false,
    "stone_type" TEXT,
    "stone_details" TEXT,
    "silver_rate_at_purchase" DECIMAL(10,2) NOT NULL,
    "purchase_price_per_gram" DECIMAL(10,2) NOT NULL,
    "purchase_price_per_piece" DECIMAL(10,2) NOT NULL,
    "status" "InventoryStatus" NOT NULL DEFAULT 'AVAILABLE',
    "purchased_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "silver_rate_cache" (
    "id" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PKR',
    "rate_per_gram" DECIMAL(10,4) NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'goldpricez',
    "fetched_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "raw_response" JSONB,

    CONSTRAINT "silver_rate_cache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_sku_key" ON "inventory_items"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_barcode_key" ON "inventory_items"("barcode");

-- CreateIndex
CREATE INDEX "inventory_items_category_id_idx" ON "inventory_items"("category_id");

-- CreateIndex
CREATE INDEX "inventory_items_sku_idx" ON "inventory_items"("sku");

-- CreateIndex
CREATE INDEX "inventory_items_barcode_idx" ON "inventory_items"("barcode");

-- CreateIndex
CREATE INDEX "inventory_items_status_idx" ON "inventory_items"("status");

-- CreateIndex
CREATE INDEX "silver_rate_cache_currency_fetched_at_idx" ON "silver_rate_cache"("currency", "fetched_at");

-- CreateIndex
CREATE INDEX "sale_items_inventory_item_id_idx" ON "sale_items"("inventory_item_id");

-- CreateIndex
CREATE INDEX "sales_status_idx" ON "sales"("status");

-- CreateIndex
CREATE INDEX "sales_sale_type_idx" ON "sales"("sale_type");

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
