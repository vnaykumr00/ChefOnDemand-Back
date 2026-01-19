-- 11_update_booking_status.sql

-- 1. Update the booking_status ENUM
-- Postgres doesn't support "CREATE OR REPLACE TYPE" or easy add of multiple values in one go nicely if they exist.
-- Best approach is to alter the type to add values if they don't exist.

DO $$
BEGIN
    ALTER TYPE "booking_status" ADD VALUE IF NOT EXISTS 'ORDER_PLACED';
    ALTER TYPE "booking_status" ADD VALUE IF NOT EXISTS 'CHEF_ACCEPTED';
    ALTER TYPE "booking_status" ADD VALUE IF NOT EXISTS 'CHEF_ARRIVED';
    ALTER TYPE "booking_status" ADD VALUE IF NOT EXISTS 'INGREDIENTS_VERIFIED';
    ALTER TYPE "booking_status" ADD VALUE IF NOT EXISTS 'ORDER_RECONFIRMED';
    ALTER TYPE "booking_status" ADD VALUE IF NOT EXISTS 'PAYMENT_COMPLETED';
    ALTER TYPE "booking_status" ADD VALUE IF NOT EXISTS 'COOKING_STARTED';
    ALTER TYPE "booking_status" ADD VALUE IF NOT EXISTS 'COOKING_COMPLETED';
    ALTER TYPE "booking_status" ADD VALUE IF NOT EXISTS 'ORDER_COMPLETED';
EXCEPTION
    WHEN duplicate_object THEN null; -- Ignore if already exists
END $$;

-- 2. Add StatusHistory and VerificationCode columns to bookings table
ALTER TABLE "bookings" 
ADD COLUMN IF NOT EXISTS "StatusHistory" JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS "VerificationCode" VARCHAR(6);

-- 3. Update existing 'pending' to 'ORDER_PLACED' purely for consistency if needed, 
-- but might be safer to leave old data as is or migrate handled by app logic.
-- For now, we leave data as is, but ensure new orders use NEW statuses.
