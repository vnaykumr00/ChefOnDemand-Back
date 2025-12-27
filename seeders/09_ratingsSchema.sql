-- 09_ratings.sql

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS "ratings" (
    "BookingId"        INT PRIMARY KEY REFERENCES "bookings"("Id") ON DELETE CASCADE,
    "RatingByCustomer" INT CHECK ("RatingByCustomer" BETWEEN 1 AND 5),
    "ReviewByCustomer" TEXT,
    "RatingByChef"     INT CHECK ("RatingByChef" BETWEEN 1 AND 5),
    "ReviewByChef"     TEXT,
    "CreatedAt"        TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt"        TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS update_ratings_updated_at ON "ratings";

CREATE TRIGGER update_ratings_updated_at
    BEFORE UPDATE ON "ratings"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();