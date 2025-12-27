-- 04_dishes.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS "dishes" (
    "DishId"               SERIAL PRIMARY KEY,
    "Name"             VARCHAR(100) NOT NULL UNIQUE,
    "Description"      TEXT,
    "PrepTimeMinutes"  INT DEFAULT 30 CHECK ("PrepTimeMinutes" > 0),
    "Cuisine"          VARCHAR(50),
    "IsVegetarian"     BOOLEAN DEFAULT FALSE,
    "Ingredients"      JSONB DEFAULT '[]'::jsonb,
    "IsActive"         BOOLEAN DEFAULT FALSE,
    "CreatedAt"        TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt"        TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS update_dishes_updated_at ON "dishes";

CREATE TRIGGER update_dishes_updated_at
    BEFORE UPDATE ON "dishes"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();