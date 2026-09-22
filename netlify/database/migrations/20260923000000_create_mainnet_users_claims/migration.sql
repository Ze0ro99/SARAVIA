CREATE TABLE IF NOT EXISTS "pi_users" (
  "uid" text PRIMARY KEY,
  "username" text NOT NULL,
  "wallet_address" text NOT NULL,
  "network" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE IF NOT EXISTS "pi_claims" (
  "user_uid" text PRIMARY KEY,
  "payment_id" text,
  "txid" text,
  "status" text NOT NULL,
  "amount" numeric(20,7) NOT NULL,
  "memo" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
