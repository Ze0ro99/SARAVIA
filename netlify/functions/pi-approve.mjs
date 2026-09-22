import { failure, input, json, mainnetGuard, pi, savePayment, validId, verifiedCommunityPayment } from './_pi.mjs';
export default async req => {
  try {
    mainnetGuard();
    const { paymentId } = await input(req);
    if (!validId(paymentId)) return json({ error: 'Invalid payment identifier.' }, 400);
    const payment = await verifiedCommunityPayment(req, paymentId);
    if (payment.status?.cancelled || payment.status?.user_cancelled) return json({ error: 'Payment was cancelled.' }, 409);
    if (!payment.status?.developer_approved) await pi('/payments/' + paymentId + '/approve', { method: 'POST' });
    await savePayment(payment, 'approved');
    return json({ success: true });
  } catch (error) { return failure(error); }
};
export const config = { path: '/.netlify/functions/pi-approve' };
