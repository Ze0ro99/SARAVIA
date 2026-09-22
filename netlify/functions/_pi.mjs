import { db } from '../../db/index.ts';
import { piPayments } from '../../db/schema.ts';

const API = 'https://api.minepi.com/v2';
export const json = (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
export function validId(value) { return typeof value === 'string' && /^[A-Za-z0-9_-]{8,160}$/.test(value); }
export async function input(req) {
  if (req.method !== 'POST') throw Object.assign(new Error('Method not allowed'), { status: 405 });
  if (!req.headers.get('content-type')?.includes('application/json')) throw Object.assign(new Error('JSON body required'), { status: 415 });
  return req.json();
}
function key() {
  const value = Netlify.env.get('PI_API_KEY');
  if (!value) throw Object.assign(new Error('Pi payments are not configured yet.'), { status: 503 });
  return value;
}
export async function pi(path, options = {}) {
  const response = await fetch(`${API}${path}`, { ...options, headers: { Authorization: `Key ${key()}`, 'Content-Type': 'application/json', ...options.headers } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(data.error_message || data.error || 'Pi Network rejected the request.'), { status: response.status });
  return data;
}
export async function authenticatedUser(req) {
  const authorization = req.headers.get('authorization') || '';
  if (!authorization.startsWith('Bearer ')) throw Object.assign(new Error('Pi authentication required.'), { status: 401 });
  const response = await fetch(`${API}/me`, { headers: { Authorization: authorization } });
  const user = await response.json().catch(() => ({}));
  if (!response.ok || !user.uid) throw Object.assign(new Error('Invalid Pi session.'), { status: 401 });
  return user;
}
export async function verifiedDonation(req, paymentId) {
  const [user, payment] = await Promise.all([authenticatedUser(req), pi(`/payments/${paymentId}`)]);
  const amount = Number(payment.amount);
  if (payment.user_uid !== user.uid || amount !== 0.1 || payment.metadata?.type !== 'saravia_donation' || payment.direction !== 'user_to_app' || payment.network !== 'Pi Network') {
    throw Object.assign(new Error('Payment details do not match this donation.'), { status: 422 });
  }
  return payment;
}
export async function savePayment(payment, status, txid = null) {
  await db.insert(piPayments).values({ paymentId: payment.identifier, userUid: payment.user_uid, amount: String(payment.amount), status, txid, updatedAt: new Date() })
    .onConflictDoUpdate({ target: piPayments.paymentId, set: { status, txid, updatedAt: new Date() } });
}
export function failure(error) { console.error('Pi payment endpoint failed', error instanceof Error ? error.message : 'Unknown error'); return json({ error: error instanceof Error ? error.message : 'Unexpected payment error.' }, error.status || 500); }
