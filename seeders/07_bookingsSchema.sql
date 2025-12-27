-- 07_bookings.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
    CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "bookings" (
    "Id"           SERIAL PRIMARY KEY,
    "CustomerId"   UUID NOT NULL REFERENCES "users"("Id") ON DELETE CASCADE,
    "ChefId"       UUID NOT NULL REFERENCES "users"("Id") ON DELETE CASCADE,
    "ServiceDate"  TIMESTAMPTZ NOT NULL,
    "Location"     JSONB NOT NULL,
    "Status"       booking_status DEFAULT 'pending',
    "TotalAmount"  DECIMAL(10, 2) NOT NULL,
    "DishIds"      JSONB NOT NULL,
    "CreatedAt"    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt"    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT positive_amount CHECK ("TotalAmount" >= 0)
);

CREATE INDEX IF NOT EXISTS idx_bookings_customer ON "bookings" ("CustomerId");
CREATE INDEX IF NOT EXISTS idx_bookings_chef ON "bookings" ("ChefId");
CREATE INDEX IF NOT EXISTS idx_bookings_service_date ON "bookings" ("ServiceDate");
CREATE INDEX IF NOT EXISTS idx_bookings_status ON "bookings" ("Status");

DROP TRIGGER IF EXISTS update_bookings_updated_at ON "bookings";

CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON "bookings"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();