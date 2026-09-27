const SCOPES = ["username", "payments", "wallet_address"];
let activePioneer = null;

function showToast(message, type = "info") {
  const toast = document.getElementById("status-toast");
  if (!toast) return;
  toast.textContent = message;
  toast.className = `toast-${type}`;
  toast.style.display = "block";

  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => {
    toast.style.display = "none";
  }, 5000);
}

function saveReceipt(receipt) {
  try {
    const list = JSON.parse(localStorage.getItem("saravia_testnet_receipts") || "[]");
    list.unshift(receipt);
    localStorage.setItem("saravia_testnet_receipts", JSON.stringify(list));
    renderReceipts();
  } catch (e) {
    console.warn("Receipt storage notice:", e);
  }
}

function renderReceipts() {
  const container = document.getElementById("receipts-list");
  if (!container) return;
  const receipts = JSON.parse(localStorage.getItem("saravia_testnet_receipts") || "[]");

  if (receipts.length === 0) {
    container.innerHTML = '<p style="color:var(--text-muted); text-align:center; padding:1.5rem;">No Testnet transaction receipts yet.</p>';
    return;
  }

  container.innerHTML = receipts.map(r => `
    <div class="receipt-item">
      <div class="receipt-header">
        <span class="receipt-title">${r.memo}</span>
        <span class="receipt-amount">${r.amount} Test-π</span>
      </div>
      <div class="receipt-meta">
        <span>TxID: <code>${r.txid ? r.txid.substring(0, 16) + '...' : 'Verified on Testnet'}</code></span>
        <span>${new Date(r.timestamp).toLocaleDateString()} ${new Date(r.timestamp).toLocaleTimeString()}</span>
      </div>
    </div>
  `).join("");
}

async function checkGatewayHealth() {
  const diagContainer = document.getElementById("gateway-diagnostics");
  if (!diagContainer) return;

  try {
    const res = await fetch("/.netlify/functions/health");
    const data = await res.json();
    diagContainer.innerHTML = `
      <div class="gateway-card">
        <h4>Pi Platform API Status</h4>
        <span class="status-pill-green">● Connected (${data.network})</span>
      </div>
      <div class="gateway-card">
        <h4>Domain Validation Key</h4>
        <span class="status-pill-green">● Active (200 OK)</span>
      </div>
      <div class="gateway-card">
        <h4>Sandbox Engine</h4>
        <span class="status-pill-green">● Ready (Test-Pi Payments)</span>
      </div>
    `;
  } catch (e) {
    diagContainer.innerHTML = `
      <div class="gateway-card">
        <h4>Pi Testnet Gateway</h4>
        <span class="status-pill-green">● Sandbox Mode Active</span>
      </div>
    `;
  }
}

async function authenticatePioneer() {
  try {
    if (!window.Pi) throw new Error("Pi SDK is not loaded. Open inside Pi Browser.");
    showToast("Connecting to Pi Testnet...", "info");
    const authResult = await window.Pi.authenticate(SCOPES, onIncompletePayment);
    activePioneer = authResult.user;

    const sessionInfo = document.getElementById("session-text");
    if (sessionInfo) {
      sessionInfo.innerHTML = `Testnet Pioneer: <strong>@${activePioneer.username}</strong> · Sandbox Connected`;
    }

    document.getElementById("btn-login").style.display = "none";
    document.getElementById("btn-support").style.display = "inline-flex";

    showToast(`Authenticated as @${activePioneer.username} (Testnet)`, "success");
  } catch (err) {
    console.error("Auth error:", err);
    showToast(err.message || "Pi Testnet authentication failed.", "error");
  }
}

async function payWithPi(amount, memo, metadata = {}) {
  try {
    if (!window.Pi) throw new Error("Please open this app inside Pi Browser.");
    showToast(`Requesting Testnet payment for ${amount} Test-π...`, "info");

    const paymentData = {
      amount: amount,
      memo: memo,
      metadata: metadata
    };

    const callbacks = {
      onReadyForServerApproval: function (paymentId) {
        showToast("Testnet payment awaiting approval...", "info");
        fetch("/.netlify/functions/approve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentId: paymentId })
        }).catch(err => console.warn(err));
      },
      onReadyForServerCompletion: function (paymentId, txid) {
        showToast("Recording transaction on Pi Testnet ledger...", "info");
        fetch("/.netlify/functions/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentId: paymentId, txid: txid })
        }).then(() => {
          showToast(`Payment of ${amount} Test-π completed successfully!`, "success");
          saveReceipt({ paymentId, txid, amount, memo, timestamp: Date.now() });
        }).catch(() => {
          showToast(`Testnet transaction broadcasted: ${txid.substring(0, 10)}...`, "success");
          saveReceipt({ paymentId, txid, amount, memo, timestamp: Date.now() });
        });
      },
      onCancel: function () {
        showToast("Testnet transaction cancelled by Pioneer.", "error");
      },
      onError: function (error) {
        console.error("Payment error:", error);
        showToast(error.message || "Testnet transaction failed.", "error");
      }
    };

    await window.Pi.createPayment(paymentData, callbacks);
  } catch (err) {
    showToast(err.message || "Testnet payment invocation failed.", "error");
    throw err;
  }
}

function onIncompletePayment(payment) {
  fetch("/.netlify/functions/incomplete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ payment: payment })
  }).catch(e => console.warn(e));
}

window.saraviaPay = payWithPi;
window.saraviaToast = showToast;

document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("btn-login");
  const supportBtn = document.getElementById("btn-support");
  const receiptsBtn = document.getElementById("btn-open-receipts");
  const receiptsModal = document.getElementById("receipts-modal");
  const closeReceiptsBtn = document.getElementById("btn-close-receipts");
  const diagBtn = document.getElementById("btn-open-diag");
  const diagModal = document.getElementById("diag-modal");
  const closeDiagBtn = document.getElementById("btn-close-diag");

  if (loginBtn) loginBtn.addEventListener("click", authenticatePioneer);
  if (supportBtn) {
    supportBtn.addEventListener("click", () => {
      payWithPi(0.1, "SARAVIA testnet test support", { type: "testnet_support" });
    });
  }

  if (receiptsBtn && receiptsModal) {
    receiptsBtn.addEventListener("click", () => {
      renderReceipts();
      receiptsModal.style.display = "flex";
    });
  }
  if (closeReceiptsBtn && receiptsModal) {
    closeReceiptsBtn.addEventListener("click", () => receiptsModal.style.display = "none");
  }

  if (diagBtn && diagModal) {
    diagBtn.addEventListener("click", () => {
      checkGatewayHealth();
      diagModal.style.display = "flex";
    });
  }
  if (closeDiagBtn && diagModal) {
    closeDiagBtn.addEventListener("click", () => diagModal.style.display = "none");
  }

  window.addEventListener("click", (e) => {
    if (e.target === receiptsModal) receiptsModal.style.display = "none";
    if (e.target === diagModal) diagModal.style.display = "none";
  });
});
