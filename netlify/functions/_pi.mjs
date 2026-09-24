import { eq } from 'drizzle-orm';
import { db } from '../../db/index.ts';
import { piClaims, piPayments, piUsers } from '../../db/schema.ts';

export const API = 'https://api.minepi.com/v2';
export const SUPPORT_MEMO = 'SARAVIA mainnet support';
export const SUPPORT_AMOUNT = 0.1;
export const WELCOME_MEMO = 'SARAVIA welcome bonus';
export const WELCOME_AMOUNT = 0.01;

export function env(name) {
  const netlify = globalThis.Netlify;
  if (netlify && netlify.env && typeof netlify.env.get === 'function') return netlify.env.get(name);
  return process.env[name];
}
export function mainnetGuard(withWallet = false) {
  if (env('PI_NETWORK') !== 'mainnet' || !env('PI_API_KEY') || !env('PI_APP_ID')) throw Object.assign(new Error('Mainnet Pi payments are not configured.'), { status: 500 });
  if (withWallet && !env('PI_APP_WALLET_PRIVATE_SEED')) throw Object.assign(new Error('Mainnet A2U wallet is not configured.'), { status: 500 });
}
export function json(body, status = 200) { return Response.json(body, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } }); }
export function validId(value) { return typeof value === 'string' && /^[A-Za-z0-9_-]{8,200}$/.test(value); }
export async function input(req) {
  if (req.method !== 'POST') throw Object.assign(new Error('Method not allowed'), { status: 405 });
  if (!req.headers.get('content-type')?.includes('application/json')) throw Object.assign(new Error('JSON body required'), { status: 415 });
  return req.json();
}
export function failure(error) {
  console.error('Mainnet Pi endpoint failed', error instanceof Error ? error.message : 'Unknown error');
  return json({ error: error instanceof Error ? error.message : 'Unexpected Mainnet payment error.' }, error?.status || 500);
}
export async function pi(path, options = {}) {
  mainnetGuard();
  const response = await fetch(API + path, { ...options, headers: { Authorization: 'Key ' + env('PI_API_KEY'), Accept: 'application/json', 'Content-Type': 'application/json', ...options.headers } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(data.error_message || data.error || 'Pi Network rejected the request.'), { status: response.status });
  return data;
}
export async function authenticatedUser(req, suppliedToken = '') {
  mainnetGuard();
  const header = req.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : suppliedToken;
  if (!token || token.length > 4096) throw Object.assign(new Error('Pi authentication required.'), { status: 401 });
  const response = await fetch(API + '/me', { headers: { Authorization: 'Bearer ' + token, Accept: 'application/json' } });
  const user = await response.json().catch(() => ({}));
  if (!response.ok || !user.uid) throw Object.assign(new Error('Invalid Pi session.'), { status: 401 });
  const walletAddress = user.wallet_address || user.walletAddress;
  if (!walletAddress) throw Object.assign(new Error('Wallet access is required for SARAVIA Mainnet.'), { status: 403 });
  return { uid: String(user.uid), username: String(user.username || 'Pioneer'), wallet_address: String(walletAddress) };
}
export async function saveUser(user) {
  await db.insert(piUsers).values({ uid: user.uid, username: user.username, walletAddress: user.wallet_address, network: 'mainnet', updatedAt: new Date() }).onConflictDoUpdate({ target: piUsers.uid, set: { username: user.username, walletAddress: user.wallet_address, updatedAt: new Date() } });
}
export async function reserveClaim(userUid) {
  const inserted = await db.insert(piClaims).values({ userUid, status: 'processing', amount: String(WELCOME_AMOUNT), memo: WELCOME_MEMO }).onConflictDoNothing().returning({ userUid: piClaims.userUid });
  if (inserted.length) return null;
  return getClaim(userUid);
}
export async function getClaim(uid) {
  const rows = await db.select().from(piClaims).where(eq(piClaims.userUid, uid)).limit(1);
  return rows[0] || null;
}
export async function saveClaim(userUid, data) {
  await db.insert(piClaims).values({ userUid, paymentId: data.paymentId || null, txid: data.txid || null, status: data.status, amount: String(data.amount ?? WELCOME_AMOUNT), memo: data.memo || WELCOME_MEMO, updatedAt: new Date() }).onConflictDoUpdate({ target: piClaims.userUid, set: { paymentId: data.paymentId || null, txid: data.txid || null, status: data.status, amount: String(data.amount ?? WELCOME_AMOUNT), memo: data.memo || WELCOME_MEMO, updatedAt: new Date() } });
}
export async function savePayment(payment, status, txid = null) {
  await db.insert(piPayments).values({ paymentId: payment.identifier, userUid: payment.user_uid, amount: String(payment.amount), status, txid, updatedAt: new Date() }).onConflictDoUpdate({ target: piPayments.paymentId, set: { status, txid, updatedAt: new Date() } });
}
export async function verifiedCommunityPayment(req, paymentId) {
  const [user, payment] = await Promise.all([authenticatedUser(req), pi('/payments/' + paymentId)]);
  const memo = String(payment.memo || '');
  const validMemo = memo === SUPPORT_MEMO || memo === 'SARAVIA hotel booking' || /^SARAVIA booking [A-Za-z0-9_-]+$/.test(memo);
  if (payment.user_uid !== user.uid || Number(payment.amount) !== SUPPORT_AMOUNT || !validMemo || payment.metadata?.type !== 'community_support' || payment.direction !== 'user_to_app' || payment.network !== 'Pi Network') throw Object.assign(new Error('Payment details do not match this Mainnet community payment.'), { status: 422 });
  return payment;
}
export async function mainnetPiClient() {
  mainnetGuard(true);
  const module = await import('pi-backend');
  const PiNetwork = module.default || module;
  return new PiNetwork(env('PI_API_KEY'), env('PI_APP_WALLET_PRIVATE_SEED'));
}
