-- Add the new status to the booking_status enum type
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'INGREDIENT_ISSUE_REPORTED';
