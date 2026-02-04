-- Add Stripe price ID to products table
-- Run: npx prisma migrate dev --name add_stripe_price_id

ALTER TABLE "products" 
ADD COLUMN "stripe_price_id" TEXT;

-- Optional: Add index for faster lookups
CREATE INDEX "idx_products_stripe_price_id" ON "products"("stripe_price_id");

-- Optional: Add comment
COMMENT ON COLUMN "products"."stripe_price_id" IS 'Stripe Price ID (price_xxx) for secure checkout';
