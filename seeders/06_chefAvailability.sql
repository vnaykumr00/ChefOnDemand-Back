-- 06_chefAvailability.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE OR REPLACE FUNCTION update_last_updated_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."LastUpdated" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS "chefAvailability" (
    "ChefId"      UUID PRIMARY KEY REFERENCES "users"("Id") ON DELETE CASCADE,
    "LocLat"      DECIMAL(10, 8) NOT NULL,
    "LocLng"      DECIMAL(11, 8) NOT NULL,
    "LastUpdated" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS update_chef_availability_last_updated ON "chefAvailability";

CREATE TRIGGER update_chef_availability_last_updated
    BEFORE UPDATE ON "chefAvailability"
    FOR EACH ROW
    EXECUTE FUNCTION update_last_updated_column();