-- Booking Status Enum
DO $$ BEGIN
    CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Bookings Table
create table IF NOT EXISTS public.bookings (
  "Id" serial not null,
  "CustomerId" uuid not null,
  "ChefId" uuid not null,
  "ServiceDate" timestamp with time zone not null,
  "Location" jsonb not null,
  "Status" public.booking_status null default 'pending'::booking_status,
  "TotalAmount" numeric(10, 2) not null,
  "DishIds" jsonb not null,
  "CreatedAt" timestamp with time zone null default CURRENT_TIMESTAMP,
  "UpdatedAt" timestamp with time zone null default CURRENT_TIMESTAMP,
  
  constraint bookings_pkey primary key ("Id"),
  constraint bookings_ChefId_fkey foreign KEY ("ChefId") references users ("Id") on delete CASCADE,
  constraint bookings_CustomerId_fkey foreign KEY ("CustomerId") references users ("Id") on delete CASCADE,
  constraint positive_amount check (("TotalAmount" >= (0)::numeric))
) TABLESPACE pg_default;

-- Indexes
create index IF not exists idx_bookings_customer on public.bookings using btree ("CustomerId") TABLESPACE pg_default;
create index IF not exists idx_bookings_chef on public.bookings using btree ("ChefId") TABLESPACE pg_default;
create index IF not exists idx_bookings_service_date on public.bookings using btree ("ServiceDate") TABLESPACE pg_default;
create index IF not exists idx_bookings_status on public.bookings using btree ("Status") TABLESPACE pg_default;

-- Trigger for UpdatedAt (Assuming function exists from previous schemas, if not create it)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."UpdatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_bookings_updated_at ON public.bookings;
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
