import { authenticatedUser, failure, input, json, pi, savePayment, validId } from './_pi.mjs';
export default async req => {
  try {
    const { paymentId } = await input(req);
    if (!validId(paymentId)) return json({ error: 'Invalid payment identifier.' }, 400);
    const [user, payment] = await Promise.all([authenticatedUser(req), pi(`/payments/${paymentId}`)]);
    if (payment.user_uid !== user.uid) return json({ error: 'Payment does not belong to this user.' }, 403);
    if (!payment.status?.cancelled && !payment.status?.developer_completed) await pi(`/payments/${paymentId}/cancel`, { method: 'POST' });
    await savePayment(payment, 'cancelled');
    return json({ success: true });
  } catch (error) { return failure(error); }
};
export const config = { path: '/.netlify/functions/pi-cancel' };
