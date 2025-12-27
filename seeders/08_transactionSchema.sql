-- 08_transactions.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
    CREATE TYPE transaction_status AS ENUM ('pending', 'paid', 'refunded', 'failed');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "transactions" (
    "Id"             SERIAL PRIMARY KEY,
    "BookingId"      INT NOT NULL REFERENCES "bookings"("Id") ON DELETE CASCADE,
    "Amount"         DECIMAL(10, 2) NOT NULL CHECK ("Amount" >= 0),
    "Commission"     DECIMAL(10, 2) NOT NULL CHECK ("Commission" >= 0),
    "ChefPayout"     DECIMAL(10, 2) NOT NULL CHECK ("ChefPayout" >= 0),
    "Status"         transaction_status DEFAULT 'pending',
    "PaymentMethod"  VARCHAR(50),
    "TransactionRef" VARCHAR(255),
    "CreatedAt"      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt"      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_payout CHECK ("ChefPayout" = "Amount" - "Commission")
);

CREATE INDEX IF NOT EXISTS idx_transactions_booking ON "transactions" ("BookingId");
CREATE INDEX IF NOT EXISTS idx_transactions_status ON "transactions" ("Status");

DROP TRIGGER IF EXISTS update_transactions_updated_at ON "transactions";

CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON "transactions"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();