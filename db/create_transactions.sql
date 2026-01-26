DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'transaction_status') THEN
        CREATE TYPE public.transaction_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
    END IF;
END $$;

create table public.transactions (
  "Id" serial not null,
  "BookingId" integer not null,
  "Amount" numeric(10, 2) not null,
  "Commission" numeric(10, 2) not null,
  "ChefPayout" numeric(10, 2) not null,
  "Status" public.transaction_status null default 'pending'::transaction_status,
  "PaymentMethod" character varying(50) null,
  "TransactionRef" character varying(255) null,
  "CreatedAt" timestamp with time zone null default CURRENT_TIMESTAMP,
  "UpdatedAt" timestamp with time zone null default CURRENT_TIMESTAMP,
  constraint transactions_pkey primary key ("Id"),
  constraint transactions_BookingId_fkey foreign KEY ("BookingId") references bookings ("Id") on delete CASCADE,
  constraint transactions_Amount_check check (("Amount" >= (0)::numeric)),
  constraint transactions_ChefPayout_check check (("ChefPayout" >= (0)::numeric)),
  constraint transactions_Commission_check check (("Commission" >= (0)::numeric)),
  constraint valid_payout check (("ChefPayout" = ("Amount" - "Commission")))
) TABLESPACE pg_default;

create index IF not exists idx_transactions_booking on public.transactions using btree ("BookingId") TABLESPACE pg_default;

create index IF not exists idx_transactions_status on public.transactions using btree ("Status") TABLESPACE pg_default;

create trigger update_transactions_updated_at BEFORE
update on transactions for EACH row
execute FUNCTION update_updated_at_column ();
