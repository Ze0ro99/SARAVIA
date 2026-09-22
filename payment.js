(() => {
  const button = document.querySelector('#donateButton');
  const label = document.querySelector('#buttonLabel');
  const status = document.querySelector('#paymentStatus');
  const statusText = document.querySelector('#statusText');
  let auth;
  let sessionVerified = false;
  let pendingIncompletePayment;
  const update = (message, type = '', busy = false) => { statusText.textContent = message; status.className = `status ${type}`.trim(); button.disabled = busy; label.textContent = busy ? 'Payment in progress…' : 'Donate 0.1 Pi'; };
  async function post(path, body) {
    const response = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.accessToken}` }, body: JSON.stringify(body) });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'The payment service is unavailable.');
    return result;
  }
  async function recover(payment) {
    if (!payment?.identifier) return;
    update('Restoring your unfinished payment…', '', true);
    try {
      if (payment.transaction?.txid && !payment.status?.developer_completed) {
        await post('/.netlify/functions/pi-complete', { paymentId: payment.identifier, txid: payment.transaction.txid });
        update('Your 0.1 Pi donation is complete. Thank you!', 'success');
      } else if (!payment.status?.developer_approved) {
        await post('/.netlify/functions/pi-cancel', { paymentId: payment.identifier });
        update('Previous payment cleared. Ready to donate.');
      } else update('Finish the pending payment in your Pi wallet.');
    } catch (error) { update(error.message, 'error'); }
  }
  async function authenticate() {
    if (!window.Pi) { update('Open this page in Pi Browser to donate.', 'error'); button.disabled = true; return; }
    window.Pi.init({ version: '2.0', sandbox: false });
    update('Connecting securely to Pi…', '', true);
    try {
      auth = await window.Pi.authenticate(['username', 'payments'], payment => {
        if (sessionVerified) recover(payment);
        else pendingIncompletePayment = payment;
      });
      const verifiedUser = await post('/.netlify/functions/pi-auth', {});
      sessionVerified = true;
      update(`Ready, @${verifiedUser.username}`);
      if (pendingIncompletePayment) {
        const payment = pendingIncompletePayment;
        pendingIncompletePayment = undefined;
        await recover(payment);
      }
    }
    catch (error) { auth = undefined; sessionVerified = false; update(error.message || 'Pi authentication was not completed.', 'error'); }
  }
  async function donate() {
    if (!auth) { await authenticate(); if (!auth) return; }
    update('Confirm the payment in your Pi wallet…', '', true);
    try {
      await window.Pi.createPayment({ amount: 0.1, memo: 'Support Saravia travel services with a 0.1 Pi donation', metadata: { type: 'saravia_donation', version: 1 } }, {
        onReadyForServerApproval: async paymentId => { update('Securely approving your donation…', '', true); await post('/.netlify/functions/pi-approve', { paymentId }); },
        onReadyForServerCompletion: async (paymentId, txid) => { update('Confirming your donation on Pi Network…', '', true); await post('/.netlify/functions/pi-complete', { paymentId, txid }); update('Your 0.1 Pi donation is complete. Thank you!', 'success'); },
        onCancel: paymentId => { post('/.netlify/functions/pi-cancel', { paymentId }).catch(() => {}); update('Payment cancelled. You can try again anytime.'); },
        onError: error => update(error?.message || 'Payment could not be completed.', 'error'),
      });
    } catch (error) { update(error.message || 'Payment could not be started.', 'error'); }
  }
  button.addEventListener('click', donate);
  authenticate();
})();
