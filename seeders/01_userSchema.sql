-- 01_userSchema.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."UpdatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS "users" (
    "Id"            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    "Name"          VARCHAR(255) NOT NULL,  
    "Email"         VARCHAR(255) UNIQUE NOT NULL,
    "Phone"         VARCHAR(15) UNIQUE NOT NULL,
    "PhoneVerified" BOOLEAN DEFAULT FALSE,
    "Address"       JSONB        NOT NULL,
    "Role"          VARCHAR(50) NOT NULL,
    "CreatedAt"     TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt"     TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS update_users_updated_at ON "users";

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON "users"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();