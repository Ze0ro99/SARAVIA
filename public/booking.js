(function () {
  const DESTINATIONS = [
    { id: "dubai", city: "Dubai", country: "United Arab Emirates", stay: "Marina Grand Reserve", nights: 3, deposit: 0.1, note: "Airport transfer and late checkout." },
    { id: "paris", city: "Paris", country: "France", stay: "Left Bank Signature Suites", nights: 3, deposit: 0.1, note: "Concierge welcome and museum desk." },
    { id: "istanbul", city: "Istanbul", country: "Turkiye", stay: "Bosphorus Collection", nights: 3, deposit: 0.1, note: "Private transfer and terrace breakfast." },
    { id: "tokyo", city: "Tokyo", country: "Japan", stay: "Shinjuku Skyline Retreat", nights: 3, deposit: 0.1, note: "Station meet-and-greet and quiet floor." }
  ];

  function bookingMemo(id) {
    return "SARAVIA booking " + id;
  }

  function renderCatalog() {
    var root = document.getElementById("booking-grid");
    if (!root) return;
    root.innerHTML = DESTINATIONS.map(function (item) {
      return (
        '<article class="card stay-card">' +
          '<div class="card-top"><span class="index">STAY</span><span class="tag">' + item.country + "</span></div>" +
          "<h2>" + item.city + "</h2>" +
          "<p>" + item.stay + " · " + item.nights + " nights</p>" +
          "<p>" + item.note + "</p>" +
          '<p class="lede">Deposit <strong>' + item.deposit + " π</strong></p>" +
          '<button class="button book-stay" type="button" data-id="' + item.id + '">Book with Pi</button>' +
        "</article>"
      );
    }).join("");
  }

  async function bookStay(id) {
    var item = DESTINATIONS.find(function (row) { return row.id === id; });
    if (!item) return;
    if (typeof window.saraviaPay !== "function") {
      throw new Error("Open this app in Pi Browser and sign in first.");
    }
    await window.saraviaPay(item.deposit, bookingMemo(item.id), {
      type: "booking",
      destination: item.id,
      stay: item.stay,
      nights: item.nights
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    renderCatalog();
    var root = document.getElementById("booking-grid");
    if (!root) return;
    root.addEventListener("click", function (event) {
      var button = event.target.closest(".book-stay");
      if (!button) return;
      bookStay(button.getAttribute("data-id")).catch(function (error) {
        if (typeof window.saraviaStatus === "function") {
          window.saraviaStatus(error.message || "Booking payment failed.", "error");
        }
      });
    });
  });
})();
