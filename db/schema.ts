import { pgTable, text, numeric, timestamp } from 'drizzle-orm/pg-core';
export const piPayments = pgTable('pi_payments', {
  paymentId: text('payment_id').primaryKey(), userUid: text('user_uid'), amount: numeric('amount', { precision: 20, scale: 7 }).notNull(),
  status: text('status').notNull(), txid: text('txid'), createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(), updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
export const piUsers = pgTable('pi_users', {
  uid: text('uid').primaryKey(), username: text('username').notNull(), walletAddress: text('wallet_address').notNull(), network: text('network').notNull(), createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(), updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
export const piClaims = pgTable('pi_claims', {
  userUid: text('user_uid').primaryKey(), paymentId: text('payment_id'), txid: text('txid'), status: text('status').notNull(), amount: numeric('amount', { precision: 20, scale: 7 }).notNull(), memo: text('memo').notNull(), createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(), updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
