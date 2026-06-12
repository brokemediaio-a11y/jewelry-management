-- CreateEnum
CREATE TYPE "ItemQuality" AS ENUM ('PREMIUM', 'LOCAL');

-- CreateEnum
CREATE TYPE "StoneOptionKind" AS ENUM ('TYPE', 'COLOR', 'CUT', 'CLARITY');

-- CreateTable
CREATE TABLE "stone_options" (
    "id" TEXT NOT NULL,
    "kind" "StoneOptionKind" NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stone_options_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stone_options_kind_idx" ON "stone_options"("kind");

-- CreateIndex
CREATE UNIQUE INDEX "stone_options_kind_name_key" ON "stone_options"("kind", "name");

-- AlterTable
ALTER TABLE "inventory_items" ADD COLUMN "item_quality" "ItemQuality" NOT NULL DEFAULT 'LOCAL',
ADD COLUMN "stone_type_id" TEXT,
ADD COLUMN "stone_color_id" TEXT,
ADD COLUMN "stone_cut_id" TEXT,
ADD COLUMN "stone_clarity_id" TEXT,
ADD COLUMN "stone_price" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "inventory_items" DROP COLUMN "has_stone",
DROP COLUMN "stone_type",
DROP COLUMN "stone_details";

-- AlterTable
ALTER TABLE "sale_items" ADD COLUMN "item_quality" "ItemQuality" NOT NULL DEFAULT 'LOCAL',
ADD COLUMN "stone_type_name" TEXT,
ADD COLUMN "stone_color_name" TEXT,
ADD COLUMN "stone_cut_name" TEXT,
ADD COLUMN "stone_clarity_name" TEXT,
ADD COLUMN "stone_price" DECIMAL(10,2);

-- CreateIndex
CREATE INDEX "inventory_items_item_quality_idx" ON "inventory_items"("item_quality");

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_stone_type_id_fkey" FOREIGN KEY ("stone_type_id") REFERENCES "stone_options"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_stone_color_id_fkey" FOREIGN KEY ("stone_color_id") REFERENCES "stone_options"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_stone_cut_id_fkey" FOREIGN KEY ("stone_cut_id") REFERENCES "stone_options"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_stone_clarity_id_fkey" FOREIGN KEY ("stone_clarity_id") REFERENCES "stone_options"("id") ON DELETE SET NULL ON UPDATE CASCADE;
