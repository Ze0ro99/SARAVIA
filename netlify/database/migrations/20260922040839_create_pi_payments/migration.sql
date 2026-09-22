CREATE TABLE "pi_payments" (
	"payment_id" text PRIMARY KEY,
	"user_uid" text,
	"amount" numeric(20,7) NOT NULL,
	"status" text NOT NULL,
	"txid" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
