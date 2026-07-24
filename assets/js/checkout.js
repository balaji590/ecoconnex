/* ============================================================
   Eco Connex — Shared Customer Details Checkout Modal.
   One module, used by every page with a cart (Home, Products,
   Product Details, About, Contact, Privacy, Terms, Shipping).
   Injects its own modal markup into the page once, so no page
   needs to duplicate this HTML — only calls
   window.EcoConnex.openCheckoutModal() from its existing
   "Checkout via WhatsApp" button.
   ============================================================ */
window.EcoConnex = window.EcoConnex || {};

(function (ns) {
  "use strict";

  const STORAGE_KEY = "ecoconnex_checkout_details_v1";
  const GST_REGEX = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
  const WHATSAPP_NUMBER = "918778657912";

  let injected = false;
  let submitting = false;
  let lastFocused = null;

  /* ---------- Validation (pure functions, reusable, testable) ---------- */

  function validateName(v) {
    v = (v || "").trim();
    if (!v) return { valid: false, message: "Please enter your name." };
    if (v.length < 3) return { valid: false, message: "Name must be at least 3 characters." };
    return { valid: true, value: v };
  }

  function validateMobile(v) {
    let digits = (v || "").replace(/\D/g, "");
    if (digits.length === 12 && digits.indexOf("91") === 0) digits = digits.slice(2);
    if (digits.length === 11 && digits.charAt(0) === "0") digits = digits.slice(1);
    if (!digits) return { valid: false, message: "Please enter your mobile number." };
    if (!/^[6-9]\d{9}$/.test(digits)) return { valid: false, message: "Enter a valid 10-digit Indian mobile number." };
    return { valid: true, value: digits };
  }

  function validateAddress(v) {
    v = (v || "").trim();
    if (!v) return { valid: false, message: "Please enter your delivery address." };
    if (v.length < 10) return { valid: false, message: "Address must be at least 10 characters." };
    return { valid: true, value: v };
  }

  function validateGST(v) {
    v = (v || "").trim().toUpperCase();
    if (!v) return { valid: true, value: "" }; // optional
    if (!GST_REGEX.test(v)) return { valid: false, message: "GST format looks invalid. Example: 22AAAAA0000A1Z5" };
    return { valid: true, value: v };
  }

  function formatMobileInput(v) {
    return (v || "").replace(/\D/g, "").slice(0, 10);
  }

  /* ---------- localStorage (saved customer details) ---------- */

  function loadSaved() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function saveDetails(details) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(details));
    } catch (e) { /* storage unavailable — non-fatal, order still proceeds */ }
  }

  function clearSaved() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
  }

  /* ---------- WhatsApp message (never misses a cart item) ---------- */

  function buildMessage(details, cart, totals) {
    const divider = "━━━━━━━━━━━━━━━━━━";
    let msg = "🛒 *Eco Connex Order*\n" + divider + "\n\n";
    msg += "👤 *Customer Details*\n\n";
    msg += "Name: " + details.name + "\n";
    msg += "Mobile: " + details.mobile + "\n";
    msg += "Address: " + details.address + "\n";
    msg += "GST: " + (details.gst || "Not Provided") + "\n\n";
    msg += divider + "\n\n📦 *Order Items*\n\n";

    cart.forEach(function (item, i) {
      const unit = item.price === null ? "Price on Request" : "₹" + item.price.toLocaleString("en-IN");
      const lineTotal = item.price === null ? "To be confirmed" : "₹" + (item.price * item.qty).toLocaleString("en-IN");
      msg += (i + 1) + ". " + item.name + "\n";
      msg += "   SKU: " + item.sku + "\n";
      msg += "   Quantity: " + item.qty + "\n";
      msg += "   Unit Price: " + unit + "\n";
      msg += "   Line Total: " + lineTotal + "\n\n";
    });

    msg += divider + "\n\n";
    msg += "Total Items: " + totals.count + "\n";
    msg += "Grand Total: ₹" + totals.total.toLocaleString("en-IN") + (totals.hasCallForPrice ? " + items to confirm" : "") + "\n\n";
    msg += divider + "\n\nPlease confirm this order. Thank you!";
    return msg;
  }

  /* ---------- Modal markup (injected once) ---------- */

  const MODAL_HTML =
    '<div class="modal-overlay" id="ecCheckoutOverlay">' +
      '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="ecCheckoutTitle">' +
        '<div class="modal-header">' +
          '<h3 id="ecCheckoutTitle"><i class="ti ti-brand-whatsapp"></i> Complete Your Order</h3>' +
          '<button class="modal-close" id="ecCheckoutClose" type="button" aria-label="Close checkout">&times;</button>' +
        "</div>" +
        '<div class="modal-body">' +
          '<div class="ec-returning-badge" id="ecReturningBadge" style="display:none;"><i class="ti ti-user-check"></i> Welcome back! Your saved details are filled in below.</div>' +
          '<div class="modal-order-summary">' +
            "<h4>Order Summary</h4>" +
            '<div id="ecModalItems"></div>' +
            '<div class="modal-total"><span>Total (<span id="ecModalCount">0</span> items)</span><strong id="ecModalTotal">₹0</strong></div>' +
          "</div>" +
          '<form id="ecCheckoutForm" novalidate>' +
            '<div class="form-group">' +
              '<label for="ecName">Your Name *</label>' +
              '<input type="text" id="ecName" placeholder="Enter your full name" autocomplete="name"/>' +
              '<div class="form-error-msg" id="ecNameError"></div>' +
            "</div>" +
            '<div class="form-group">' +
              '<label for="ecMobile">Mobile Number *</label>' +
              '<input type="tel" id="ecMobile" placeholder="10-digit mobile number" inputmode="numeric" autocomplete="tel" maxlength="10"/>' +
              '<div class="form-error-msg" id="ecMobileError"></div>' +
            "</div>" +
            '<div class="form-group">' +
              '<label for="ecAddress">Delivery Address *</label>' +
              '<textarea id="ecAddress" placeholder="Your full delivery address..." autocomplete="street-address"></textarea>' +
              '<div class="form-hint"><span id="ecAddressCount">0</span> characters (10 minimum)</div>' +
              '<div class="form-error-msg" id="ecAddressError"></div>' +
            "</div>" +
            '<div class="form-group">' +
              '<label for="ecGST">GST Number (Optional)</label>' +
              '<input type="text" id="ecGST" placeholder="Enter GST Number (if applicable)" maxlength="15"/>' +
              '<div class="form-error-msg" id="ecGSTError"></div>' +
            "</div>" +
            '<div class="ec-modal-error" id="ecModalError" style="display:none;"></div>' +
            '<button type="submit" class="btn-wa-order" id="ecPlaceOrder"><i class="ti ti-brand-whatsapp"></i> <span id="ecPlaceOrderText">Place Order on WhatsApp</span></button>' +
            '<button type="button" class="ec-clear-saved-link" id="ecClearSaved">Clear Saved Details</button>' +
          "</form>" +
        "</div>" +
      "</div>" +
    "</div>";

  function injectModal() {
    if (injected) return;
    injected = true;
    const wrap = document.createElement("div");
    wrap.innerHTML = MODAL_HTML;
    document.body.appendChild(wrap.firstElementChild);
    wireEvents();
  }

  /* ---------- Field-level validation UI helpers ---------- */

  function setFieldError(inputId, errorId, message) {
    const input = document.getElementById(inputId);
    const err = document.getElementById(errorId);
    if (message) {
      input.classList.add("field-error");
      err.textContent = message;
      err.classList.add("show");
    } else {
      input.classList.remove("field-error");
      err.classList.remove("show");
    }
  }

  function clearAllErrors() {
    ["ecName", "ecMobile", "ecAddress", "ecGST"].forEach(function (id) {
      setFieldError(id, id + "Error", "");
    });
    const modalErr = document.getElementById("ecModalError");
    modalErr.style.display = "none";
  }

  /* ---------- Wire up modal events (once) ---------- */

  function wireEvents() {
    const overlay = document.getElementById("ecCheckoutOverlay");
    const closeBtn = document.getElementById("ecCheckoutClose");
    const form = document.getElementById("ecCheckoutForm");
    const addressInput = document.getElementById("ecAddress");
    const addressCount = document.getElementById("ecAddressCount");
    const mobileInput = document.getElementById("ecMobile");
    const clearLink = document.getElementById("ecClearSaved");

    closeBtn.addEventListener("click", closeModal);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeModal();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && overlay.classList.contains("open")) closeModal();
    });

    addressInput.addEventListener("input", function () {
      addressCount.textContent = addressInput.value.length;
    });

    mobileInput.addEventListener("input", function () {
      mobileInput.value = formatMobileInput(mobileInput.value);
    });

    clearLink.addEventListener("click", function () {
      if (!loadSaved()) return;
      if (window.confirm("Clear your saved name, mobile, address and GST details from this device?")) {
        clearSaved();
        form.reset();
        addressCount.textContent = "0";
        document.getElementById("ecReturningBadge").style.display = "none";
        clearAllErrors();
      }
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      handleSubmit();
    });
  }

  function handleSubmit() {
    if (submitting) return; // prevent duplicate submissions

    const nameV = validateName(document.getElementById("ecName").value);
    const mobileV = validateMobile(document.getElementById("ecMobile").value);
    const addressV = validateAddress(document.getElementById("ecAddress").value);
    const gstV = validateGST(document.getElementById("ecGST").value);

    setFieldError("ecName", "ecNameError", nameV.valid ? "" : nameV.message);
    setFieldError("ecMobile", "ecMobileError", mobileV.valid ? "" : mobileV.message);
    setFieldError("ecAddress", "ecAddressError", addressV.valid ? "" : addressV.message);
    setFieldError("ecGST", "ecGSTError", gstV.valid ? "" : gstV.message);

    const firstInvalid = !nameV.valid ? "ecName" : !mobileV.valid ? "ecMobile" : !addressV.valid ? "ecAddress" : !gstV.valid ? "ecGST" : null;
    if (firstInvalid) {
      document.getElementById(firstInvalid).focus();
      return;
    }

    const details = { name: nameV.value, mobile: mobileV.value, address: addressV.value, gst: gstV.value };
    const cart = ns.cart.getCart();
    if (!cart.length) {
      document.getElementById("ecModalError").textContent = "Your cart is empty.";
      document.getElementById("ecModalError").style.display = "block";
      return;
    }

    submitting = true;
    const btn = document.getElementById("ecPlaceOrder");
    const btnText = document.getElementById("ecPlaceOrderText");
    btn.disabled = true;
    const prevText = btnText.textContent;
    btnText.textContent = "Generating order…";
    btn.classList.add("ec-loading");

    const totals = {
      count: ns.cart.getCount(),
      total: ns.cart.getTotal(),
      hasCallForPrice: ns.cart.hasCallForPrice()
    };
    const message = buildMessage(details, cart, totals);
    const waWindow = window.open("https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(message), "_blank");

    submitting = false;
    btn.disabled = false;
    btnText.textContent = prevText;
    btn.classList.remove("ec-loading");

    if (!waWindow) {
      document.getElementById("ecModalError").textContent = "Couldn't open WhatsApp automatically. Please allow pop-ups for this site and try again — your details are still saved.";
      document.getElementById("ecModalError").style.display = "block";
      saveDetails(details); // keep details even if popup was blocked
      return;
    }

    // Success: save details for next time, clear cart, close modal.
    saveDetails(details);
    ns.cart.clearCart();
    closeModal();
  }

  /* ---------- Open / close ---------- */

  function renderOrderSummary() {
    const cart = ns.cart.getCart();
    const total = ns.cart.getTotal();
    document.getElementById("ecModalCount").textContent = ns.cart.getCount();
    document.getElementById("ecModalTotal").textContent = "₹" + total.toLocaleString("en-IN") + (ns.cart.hasCallForPrice() ? " + items to confirm" : "");
    document.getElementById("ecModalItems").innerHTML = cart.map(function (item) {
      const priceStr = item.price === null ? "Price on Request" : "₹" + (item.price * item.qty).toLocaleString("en-IN");
      return '<div class="modal-item"><span>' + item.qty + " × " + item.name + "</span><strong>" + priceStr + "</strong></div>";
    }).join("");
  }

  function prefillFromSaved() {
    const saved = loadSaved();
    const badge = document.getElementById("ecReturningBadge");
    if (saved) {
      document.getElementById("ecName").value = saved.name || "";
      document.getElementById("ecMobile").value = saved.mobile || "";
      document.getElementById("ecAddress").value = saved.address || "";
      document.getElementById("ecGST").value = saved.gst || "";
      document.getElementById("ecAddressCount").textContent = (saved.address || "").length;
      badge.style.display = "flex";
    } else {
      badge.style.display = "none";
    }
  }

  function openCheckoutModal() {
    const cart = ns.cart.getCart();
    if (!cart.length) {
      if (typeof ns.showToast === "function") ns.showToast("Your cart is empty");
      else window.alert("Your cart is empty!");
      return;
    }
    if (typeof window.closeCart === "function") window.closeCart();

    injectModal();
    clearAllErrors();
    renderOrderSummary();
    prefillFromSaved();

    lastFocused = document.activeElement;
    const overlay = document.getElementById("ecCheckoutOverlay");
    overlay.classList.add("open");
    document.body.style.overflow = "hidden";
    setTimeout(function () { document.getElementById("ecName").focus(); }, 50);
  }

  function closeModal() {
    const overlay = document.getElementById("ecCheckoutOverlay");
    if (!overlay) return;
    overlay.classList.remove("open");
    document.body.style.overflow = "";
    if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
  }

  ns.openCheckoutModal = openCheckoutModal;
  ns.checkout = {
    validateName: validateName,
    validateMobile: validateMobile,
    validateAddress: validateAddress,
    validateGST: validateGST
  };
})(window.EcoConnex);
