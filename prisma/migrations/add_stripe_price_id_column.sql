-- Add stripePriceId column to products table
ALTER TABLE "products" ADD COLUMN "stripePriceId" TEXT;

-- Add comment explaining the column
COMMENT ON COLUMN "products"."stripePriceId" IS 'Stripe Price ID for checkout integration (e.g., price_1xxxxx)';
