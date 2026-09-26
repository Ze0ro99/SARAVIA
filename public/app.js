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

async function authenticatePioneer() {
  try {
    if (!window.Pi) {
      throw new Error("Pi SDK is loading or not available. Please open inside Pi Browser.");
    }
    showToast("Connecting to Pi Mainnet...", "info");
    const authResult = await window.Pi.authenticate(SCOPES, onIncompletePayment);
    activePioneer = authResult.user;

    const sessionInfo = document.getElementById("session-text");
    if (sessionInfo) {
      sessionInfo.innerHTML = `Welcome, <strong>@${activePioneer.username}</strong> · Pi Mainnet Connected`;
    }

    document.getElementById("btn-login").style.display = "none";
    document.getElementById("btn-support").style.display = "inline-flex";

    showToast(`Authenticated as @${activePioneer.username}`, "success");
  } catch (err) {
    console.error("Authentication error:", err);
    showToast(err.message || "Pi authentication failed.", "error");
  }
}

async function payWithPi(amount, memo, metadata = {}) {
  try {
    if (!window.Pi) {
      throw new Error("Please open this app inside Pi Browser.");
    }

    showToast(`Initiating transaction for ${amount} π...`, "info");

    const paymentData = {
      amount: amount,
      memo: memo,
      metadata: metadata
    };

    const callbacks = {
      onReadyForServerApproval: function (paymentId) {
        showToast(`Payment registered (${paymentId.substring(0, 8)}...). Awaiting server sign...`, "info");
        fetch("/.netlify/functions/approve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentId: paymentId })
        }).catch(err => console.warn("Approval webhook error:", err));
      },
      onReadyForServerCompletion: function (paymentId, txid) {
        showToast("Broadcasting transaction to Pi Mainnet...", "info");
        fetch("/.netlify/functions/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentId: paymentId, txid: txid })
        }).then(() => {
          showToast(`Transaction of ${amount} π confirmed on Pi Ledger!`, "success");
        }).catch(() => {
          showToast(`Transaction broadcasted: ${txid.substring(0, 12)}...`, "success");
        });
      },
      onCancel: function (paymentId) {
        showToast("Payment was cancelled by Pioneer.", "error");
      },
      onError: function (error, payment) {
        console.error("Payment error:", error);
        showToast(error.message || "Payment encounter an issue.", "error");
      }
    };

    await window.Pi.createPayment(paymentData, callbacks);
  } catch (err) {
    console.error("Payment error:", err);
    showToast(err.message || "Transaction failed to initiate.", "error");
    throw err;
  }
}

function onIncompletePayment(payment) {
  console.log("Incomplete payment detected:", payment);
  fetch("/.netlify/functions/incomplete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ payment: payment })
  }).catch(err => console.warn(err));
}

// Global exposure
window.saraviaPay = payWithPi;
window.saraviaToast = showToast;

document.addEventListener("DOMContentLoaded", () => {
  const loginBtn = document.getElementById("btn-login");
  const supportBtn = document.getElementById("btn-support");
  const partnerModal = document.getElementById("partner-modal");
  const openModalBtn = document.getElementById("btn-open-partner-modal");
  const closeModalBtn = document.getElementById("btn-close-modal");

  if (loginBtn) loginBtn.addEventListener("click", authenticatePioneer);
  if (supportBtn) {
    supportBtn.addEventListener("click", () => {
      payWithPi(0.1, "SARAVIA mainnet support", { type: "support" });
    });
  }

  // Modal Controls
  if (openModalBtn && partnerModal) {
    openModalBtn.addEventListener("click", () => partnerModal.style.display = "flex");
  }
  if (closeModalBtn && partnerModal) {
    closeModalBtn.addEventListener("click", () => partnerModal.style.display = "none");
  }
  window.addEventListener("click", (e) => {
    if (e.target === partnerModal) partnerModal.style.display = "none";
  });
});
