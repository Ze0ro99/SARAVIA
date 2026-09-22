import { pgTable, text, numeric, timestamp } from 'drizzle-orm/pg-core';
export const piPayments = pgTable('pi_payments', {
  paymentId: text('payment_id').primaryKey(), userUid: text('user_uid'), amount: numeric('amount', { precision: 20, scale: 7 }).notNull(),
  status: text('status').notNull(), txid: text('txid'), createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(), updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
