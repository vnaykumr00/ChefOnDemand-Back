-- 12_admin_pricing.sql

-- 1. Create Pricing Rules Table
CREATE TABLE IF NOT EXISTS "pricing_rules" (
    "RuleName" VARCHAR(50) PRIMARY KEY,
    "Value" DECIMAL(10, 2) NOT NULL,
    "Description" TEXT,
    "CreatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Seed Initial Values (Upsert)
INSERT INTO "pricing_rules" ("RuleName", "Value", "Description")
VALUES 
    ('TRANSPORT_PER_KM', 3.00, 'Charge per kilometer for chef travel'),
    ('BURNER_1', 20.00, 'Charge for using 1 burner'),
    ('BURNER_2', 0.00, 'Charge for using 2 burners'),
    ('BURNER_3', -5.00, 'Discount for using 3 burners'),
    ('CLEANING_FEE', 20.00, 'Fee for kitchen cleaning service')
ON CONFLICT ("RuleName") DO UPDATE 
SET "Value" = EXCLUDED."Value",
    "Description" = EXCLUDED."Description",
    "UpdatedAt" = CURRENT_TIMESTAMP;

-- 3. Add PricingDetails to bookings table to store snapshot of charges
ALTER TABLE "bookings" 
ADD COLUMN IF NOT EXISTS "PricingDetails" JSONB DEFAULT '{}'::jsonb;
