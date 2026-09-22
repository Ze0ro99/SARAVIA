import { failure, input, json, pi, savePayment, validId, verifiedDonation } from './_pi.mjs';
export default async req => {
  try {
    const { paymentId, txid } = await input(req);
    if (!validId(paymentId) || !validId(txid)) return json({ error: 'Invalid payment details.' }, 400);
    const payment = await verifiedDonation(req, paymentId);
    if (payment.transaction?.txid && payment.transaction.txid !== txid) return json({ error: 'Transaction does not match the payment.' }, 422);
    if (!payment.status?.developer_completed) await pi(`/payments/${paymentId}/complete`, { method: 'POST', body: JSON.stringify({ txid }) });
    await savePayment(payment, 'completed', txid);
    return json({ success: true });
  } catch (error) { return failure(error); }
};
export const config = { path: '/.netlify/functions/pi-complete' };
