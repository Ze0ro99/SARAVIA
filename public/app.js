const SCOPES = ["username", "payments", "wallet_address"];
let currentUser = null;

function setStatus(message, type = "info") {
  const box = document.getElementById("status-box");
  if (!box) return;
  box.textContent = message;
  box.className = "";
  box.classList.add(`status-${type}`);
  box.style.display = "block";
}

async function signInWithPi() {
  try {
    if (!window.Pi) {
      throw new Error("Pi SDK is not loaded. Please open inside Pi Browser.");
    }
    setStatus("Connecting with Pi Network...", "info");
    const authResult = await window.Pi.authenticate(SCOPES, onIncompletePaymentFound);
    currentUser = authResult.user;
    
    document.getElementById("user-display").textContent = "Pioneer: @" + currentUser.username;
    document.getElementById("auth-btn").style.display = "none";
    document.getElementById("support-btn").style.display = "inline-block";
    
    setStatus("Authenticated successfully as @" + currentUser.username, "success");
  } catch (err) {
    console.error("Authentication error:", err);
    setStatus(err.message || "Failed to authenticate with Pi", "error");
  }
}

async function payApp(amount, memo, metadata = {}) {
  try {
    if (!window.Pi) {
      throw new Error("Pi SDK unavailable. Use Pi Browser.");
    }
    setStatus("Requesting transaction for " + amount + " π...", "info");
    
    const paymentData = {
      amount: amount,
      memo: memo,
      metadata: metadata
    };

    const paymentCallbacks = {
      onReadyForServerApproval: function (paymentId) {
        setStatus("Payment awaiting approval: " + paymentId, "info");
        fetch("/.netlify/functions/approve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentId: paymentId })
        }).catch(err => console.warn("Approval notification sent:", err));
      },
      onReadyForServerCompletion: function (paymentId, txid) {
        setStatus("Completing payment with TxID: " + txid.substring(0, 10) + "...", "info");
        fetch("/.netlify/functions/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentId: paymentId, txid: txid })
        }).then(() => {
          setStatus("Payment of " + amount + " π completed successfully!", "success");
        }).catch(() => {
          setStatus("Payment broadcasted on Pi Ledger: " + txid, "success");
        });
      },
      onCancel: function (paymentId) {
        setStatus("Payment was cancelled by Pioneer.", "error");
      },
      onError: function (error, payment) {
        console.error("Payment error:", error);
        setStatus("Payment failed: " + (error.message || "Unknown error"), "error");
      }
    };

    await window.Pi.createPayment(paymentData, paymentCallbacks);
  } catch (err) {
    console.error("Payment invocation error:", err);
    setStatus(err.message || "Payment initiation failed", "error");
    throw err;
  }
}

function onIncompletePaymentFound(payment) {
  console.log("Incomplete payment discovered:", payment);
  fetch("/.netlify/functions/incomplete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ payment: payment })
  }).catch(e => console.error("Incomplete handling notice:", e));
}

// Global exposure for booking & support
window.saraviaPay = payApp;
window.saraviaStatus = setStatus;

document.addEventListener("DOMContentLoaded", function () {
  const authBtn = document.getElementById("auth-btn");
  const supportBtn = document.getElementById("support-btn");

  if (authBtn) {
    authBtn.addEventListener("click", signInWithPi);
  }

  if (supportBtn) {
    supportBtn.addEventListener("click", function () {
      payApp(0.1, "SARAVIA mainnet support", { type: "support" });
    });
  }
});
