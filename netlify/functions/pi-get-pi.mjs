import { authenticatedUser, env, failure, getClaim, input, json, mainnetGuard, mainnetPiClient, saveClaim } from './_pi.mjs';

async function finish(client, user, claim) {
  let txid = claim.txid || null;
  if (!txid) {
    const existing = await client.getPayment(claim.paymentId);
    const payment = existing?.payment || existing;
    txid = payment?.transaction?.txid || null;
  }
  if (!txid) txid = await client.submitPayment(claim.paymentId);
  await saveClaim(user.uid, { status: 'submitted', paymentId: claim.paymentId, txid, amount: 0.01, memo: 'SARAVIA welcome bonus' });
  const completed = await client.completePayment(claim.paymentId, txid);
  const payment = completed?.payment || completed;
  if (!payment || payment.status?.developer_completed === false) throw Object.assign(new Error('Pi has not confirmed the welcome payment.'), { status: 502 });
  await saveClaim(user.uid, { status: 'claimed', paymentId: claim.paymentId, txid, amount: 0.01, memo: 'SARAVIA welcome bonus' });
  return { paymentId: claim.paymentId, txid };
}
export default async req => {
  try {
    mainnetGuard(true);
    if (env('PI_ENABLE_GET_PI') !== 'true') return json({ error: 'Get Pi is disabled until the Mainnet app wallet is funded.' }, 503);
    const { accessToken } = await input(req);
    const user = await authenticatedUser(req, accessToken);
    const existing = await getClaim(user.uid);
    if (existing?.status === 'claimed') return json({ error: 'Already claimed', claimed: true }, 409);
    const client = await mainnetPiClient();
    if (existing?.paymentId && ['processing', 'submitted', 'pending'].includes(existing.status)) {
      const recovered = await finish(client, user, existing);
      return json({ success: true, recovered: true, claimed: true, ...recovered });
    }
    await saveClaim(user.uid, { status: 'processing', amount: 0.01, memo: 'SARAVIA welcome bonus' });
    const paymentId = await client.createPayment({ amount: 0.01, memo: 'SARAVIA welcome bonus', metadata: { type: 'welcome_bonus', once: true, network: 'mainnet' }, uid: user.uid });
    await saveClaim(user.uid, { status: 'processing', paymentId, amount: 0.01, memo: 'SARAVIA welcome bonus' });
    const result = await finish(client, user, { paymentId, status: 'processing' });
    return json({ success: true, claimed: true, ...result });
  } catch (error) { return failure(error); }
};
export const config = { path: '/.netlify/functions/pi-get-pi' };
