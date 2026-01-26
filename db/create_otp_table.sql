CREATE TABLE IF NOT EXISTS "phone_verifications" (
    "id" SERIAL PRIMARY KEY,
    "phone_number" VARCHAR(20) NOT NULL,
    "otp_code" VARCHAR(10) NOT NULL,
    "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_phone_verifications_phone" ON "phone_verifications" ("phone_number");
