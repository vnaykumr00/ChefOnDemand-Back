-- Add verification status
ALTER TABLE "chefProfiles" ADD COLUMN IF NOT EXISTS "IsVerified" BOOLEAN DEFAULT FALSE;

-- Add banking details
ALTER TABLE "chefProfiles" ADD COLUMN IF NOT EXISTS "BankName" TEXT;
ALTER TABLE "chefProfiles" ADD COLUMN IF NOT EXISTS "IfscCode" TEXT;
ALTER TABLE "chefProfiles" ADD COLUMN IF NOT EXISTS "AccountNumber" TEXT;

-- Index for performance on IsVerified since we will filter by it
CREATE INDEX IF NOT EXISTS "idx_chef_profiles_is_verified" ON "chefProfiles" ("IsVerified");
