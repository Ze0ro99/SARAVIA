import { failure, input, json, mainnetGuard, pi, savePayment, validId, verifiedCommunityPayment } from './_pi.mjs';
export default async req => {
  try {
    mainnetGuard();
    const { paymentId, txid } = await input(req);
    if (!validId(paymentId) || !validId(txid)) return json({ error: 'Invalid payment details.' }, 400);
    const payment = await verifiedCommunityPayment(req, paymentId);
    if (payment.status?.cancelled || payment.status?.user_cancelled) return json({ error: 'Payment was cancelled.' }, 409);
    if (payment.transaction?.txid && payment.transaction.txid !== txid) return json({ error: 'Transaction does not match the payment.' }, 422);
    if (!payment.status?.developer_completed) await pi('/payments/' + paymentId + '/complete', { method: 'POST', body: JSON.stringify({ txid }) });
    await savePayment(payment, 'completed', txid);
    return json({ success: true });
  } catch (error) { return failure(error); }
};
export const config = { path: '/.netlify/functions/pi-complete' };
