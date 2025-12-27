-- 05_dishMapChef.sql

-- Enable pgcrypto (safe if already enabled in previous files)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Create the join table: maps chefs to dishes they offer, with custom pricing
CREATE TABLE IF NOT EXISTS "dishMapChef" (
    "ChefId"             UUID        NOT NULL REFERENCES "users"("Id") ON DELETE CASCADE,
    "DishId"             INT         NOT NULL REFERENCES "dishes"("DishId") ON DELETE CASCADE,
    "BasePricePerPerson" DECIMAL(8, 2) NOT NULL,  -- Increased precision for future-proofing
    "IsSpecial"          BOOLEAN DEFAULT FALSE,
    "CreatedAt"          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt"          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("ChefId", "DishId")
);

-- 2. Trigger to automatically update "UpdatedAt" when price changes
DROP TRIGGER IF EXISTS update_dish_map_chef_updated_at ON "dishMapChef";
CREATE TRIGGER update_dish_map_chef_updated_at
    BEFORE UPDATE ON "dishMapChef"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();  -- Modern syntax

-- 3. Seed Data - Link Gordon to specific dishes with his custom prices
-- Safe upsert: inserts if missing, updates price if already exists
-- INSERT INTO "dishMapChef" ("ChefId", "DishId", "BasePricePerPerson")
-- SELECT 
--     u."Id" AS "ChefId",
--     d."Id" AS "DishId",
--     CASE 
--         WHEN d."Name" = 'Margherita Pizza'       THEN 24.99
--         WHEN d."Name" = 'Chicken Tikka Masala'   THEN 32.50
--         WHEN d."Name" = 'Beef Wellington'        THEN 85.00
--         WHEN d."Name" = 'Tiramisu'               THEN 18.00
--     END AS "BasePricePerPerson"
-- FROM "users" u
-- CROSS JOIN "dishes" d
-- WHERE u."Email" = 'gordon@kitchen.com'
--   AND d."Name" IN (
--     'Margherita Pizza',
--     'Chicken Tikka Masala',
--     'Beef Wellington',
--     'Tiramisu'
--   )
--   AND CASE 
--         WHEN d."Name" = 'Margherita Pizza'       THEN 24.99
--         WHEN d."Name" = 'Chicken Tikka Masala'   THEN 32.50
--         WHEN d."Name" = 'Beef Wellington'        THEN 85.00
--         WHEN d."Name" = 'Tiramisu'               THEN 18.00
--         ELSE NULL
--       END IS NOT NULL  -- Ensures only listed dishes are included
-- ON CONFLICT ("ChefId", "DishId") DO UPDATE
-- SET
--     "BasePricePerPerson" = EXCLUDED."BasePricePerPerson",
--     "UpdatedAt"          = CURRENT_TIMESTAMP;