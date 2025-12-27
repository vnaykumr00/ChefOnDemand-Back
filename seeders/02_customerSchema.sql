-- 02_customerSchema.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$ BEGIN
    CREATE TYPE subscription_tier AS ENUM ('basic', 'premium');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "customerProfiles" (
    "CustomerId"             UUID PRIMARY KEY REFERENCES "users"("Id") ON DELETE CASCADE,
    "DietaryPreferences" JSONB DEFAULT '{}'::jsonb,
    "SubscriptionTier"   subscription_tier DEFAULT 'basic',
    "CreatedAt"          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt"          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS update_customer_profiles_updated_at ON "customerProfiles";

CREATE TRIGGER update_customer_profiles_updated_at
    BEFORE UPDATE ON "customerProfiles"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();