-- Backfill workshop orders for existing custom orders (S2-M14.11)
INSERT INTO "workshop_orders" ("id", "sale_id", "status", "created_at", "updated_at")
SELECT
  gen_random_uuid()::text,
  s.id,
  CASE
    WHEN s.status = 'COMPLETED' THEN 'COMPLETE'::"WorkshopOrderStatus"
    ELSE 'SENT_TO_WORKSHOP'::"WorkshopOrderStatus"
  END,
  s.created_at,
  NOW()
FROM "sales" s
WHERE s.sale_type = 'CUSTOM_ORDER'
  AND NOT EXISTS (SELECT 1 FROM "workshop_orders" wo WHERE wo.sale_id = s.id);
