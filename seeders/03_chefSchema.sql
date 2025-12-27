-- 03_chefProfiles.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS "chefProfiles" (
    "ChefId"         UUID PRIMARY KEY REFERENCES "users"("Id") ON DELETE CASCADE,
    "Cuisine"    JSONB NOT NULL DEFAULT '[]'::jsonb,
    "TotalBookings"  INT              DEFAULT 0,
    "ProfileUrl"     JSONB            DEFAULT '{}'::jsonb,
    "ResponseRate"   DECIMAL(5, 2)    DEFAULT 0.00,
    "About"          TEXT             DEFAULT '',
    "Experience"     INT              DEFAULT 0,
    "Rating"         DECIMAL(5, 2)    DEFAULT 0.00,
    "CreatedAt"      TIMESTAMPTZ      DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt"      TIMESTAMPTZ      DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS update_chef_profiles_updated_at ON "chefProfiles";

CREATE TRIGGER update_chef_profiles_updated_at
    BEFORE UPDATE ON "chefProfiles"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();