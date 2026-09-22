import { failure, input, json, pi, savePayment, validId, verifiedDonation } from './_pi.mjs';
export default async req => {
  try {
    const { paymentId } = await input(req);
    if (!validId(paymentId)) return json({ error: 'Invalid payment identifier.' }, 400);
    const payment = await verifiedDonation(req, paymentId);
    if (!payment.status?.developer_approved) await pi(`/payments/${paymentId}/approve`, { method: 'POST' });
    await savePayment(payment, 'approved');
    return json({ success: true });
  } catch (error) { return failure(error); }
};
export const config = { path: '/.netlify/functions/pi-approve' };
