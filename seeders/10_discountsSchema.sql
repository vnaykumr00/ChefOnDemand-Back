DO $$ BEGIN
    CREATE TYPE discount_type AS ENUM ('percentage', 'fixed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "discounts" (
    "Id" SERIAL PRIMARY KEY,
    "BookingId" INT REFERENCES "bookings"("Id") ON DELETE CASCADE,
    "DiscountAmount" DECIMAL(10, 2) NOT NULL,
    "DiscountType" discount_type DEFAULT 'fixed',
    "Reason" VARCHAR(100),
    "CreatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);