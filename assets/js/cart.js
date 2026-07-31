/* ============================================================
   Eco Connex — Shared Cart Module
   Single cart data source for the whole site (persists via
   localStorage, so the cart carries over between index.html and
   products.html). Both pages render their own cart UI but call
   into these same functions, so behaviour stays consistent.
   ============================================================ */
window.EcoConnex = window.EcoConnex || {};

(function (ns) {
  "use strict";

  const STORAGE_KEY = "ecoconnex_cart_v1";
  let cart = [];
  const listeners = [];

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      cart = raw ? JSON.parse(raw) : [];
    } catch (e) {
      cart = [];
    }
  }

  function persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); } catch (e) { /* ignore */ }
    listeners.forEach(function (fn) { fn(cart.slice()); });
  }

  function onChange(fn) {
    listeners.push(fn);
  }

  /**
   * item: { name, sku, price (number or null/undefined for "Call for Price"), icon }
   * qty: optional, defaults to 1 (used by product-tile quantity selectors)
   */
  function addToCart(item, qty) {
    qty = (typeof qty === "number" && qty > 0) ? Math.floor(qty) : 1;
    const safePrice = (typeof item.price === "number" && isFinite(item.price) && item.price > 0) ? item.price : null;
    const safeMrp = (typeof item.mrp === "number" && isFinite(item.mrp) && item.mrp > 0) ? item.mrp : null;
    const existing = cart.find(function (i) { return i.sku === item.sku; });
    if (existing) {
      existing.qty += qty;
    } else {
      cart.push({
        name: item.name,
        sku: item.sku,
        price: safePrice,
        mrp: safeMrp,
        currency: item.currency || "INR",
        icon: item.icon || "🔧",
        image: item.image || null,
        qty: qty
      });
    }
    persist();
  }

  function updateQty(sku, delta) {
    const item = cart.find(function (i) { return i.sku === sku; });
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) cart = cart.filter(function (i) { return i.sku !== sku; });
    persist();
  }

  function removeItem(sku) {
    cart = cart.filter(function (i) { return i.sku !== sku; });
    persist();
  }

  function clearCart() {
    cart = [];
    persist();
  }

  function getCart() { return cart.slice(); }
  function getCount() { return cart.reduce(function (s, i) { return s + i.qty; }, 0); }
  function getTotal() { return cart.reduce(function (s, i) { return s + (i.price || 0) * i.qty; }, 0); }
  /** Sum of MRP × qty for items that actually have an MRP set (falls back to selling price when MRP is missing, so it never overstates). */
  function getTotalMRP() { return cart.reduce(function (s, i) { return s + (typeof i.mrp === "number" && i.mrp > 0 ? i.mrp : (i.price || 0)) * i.qty; }, 0); }
  /** Total MRP minus Total selling price — always >= 0, safe when no items have an offer. */
  function getTotalSavings() { return Math.max(0, getTotalMRP() - getTotal()); }
  function hasCallForPrice() { return cart.some(function (i) { return i.price === null; }); }
  /** Currency of the cart — assumes a single-currency catalog (INR today); defaults gracefully if items predate the field. */
  function getCurrency() {
    const withCurrency = cart.find(function (i) { return i.currency; });
    return (withCurrency && withCurrency.currency) || "INR";
  }

  /* ---------- Toast ---------- */
  function showToast(msg) {
    let stack = document.getElementById("ecToastStack");
    if (!stack) {
      stack = document.createElement("div");
      stack.id = "ecToastStack";
      stack.className = "ec-toast-stack";
      document.body.appendChild(stack);
    }
    const t = document.createElement("div");
    t.className = "ec-toast";
    t.innerHTML = '<i class="ti ti-circle-check-filled"></i><span>' + msg + "</span>";
    stack.appendChild(t);
    requestAnimationFrame(function () { t.classList.add("show"); });
    setTimeout(function () {
      t.classList.remove("show");
      t.classList.add("hide");
      setTimeout(function () { t.remove(); }, 300);
    }, 2400);
  }

  /**
   * Flying-product animation: clones the item's image/icon from the
   * clicked button's card and animates it flying to the header cart
   * icon, then pulses the cart badge. Falls back to a no-op silently
   * if the cart icon isn't on the page (shouldn't normally happen)
   * or if the browser doesn't support the needed APIs.
   */
  function flyToCart(sourceEl, item) {
    try {
      const cartIcon = document.querySelector(".btn-cart-nav");
      if (!cartIcon || !sourceEl) return;
      const card = sourceEl.closest(".product-card, .pdp-gallery, .wishlist-card, .qv-gallery, .mini-card");
      const imgEl = (card && card.querySelector("img.product-photo")) || document.querySelector("#zoomFrame img.product-photo, .qv-gallery img.product-photo, img.product-photo");
      const startRect = (imgEl || card || sourceEl).getBoundingClientRect();
      const endRect = cartIcon.getBoundingClientRect();

      const flying = document.createElement("div");
      flying.className = "ec-flying-item";
      flying.style.left = startRect.left + "px";
      flying.style.top = startRect.top + "px";
      flying.style.width = startRect.width + "px";
      flying.style.height = startRect.height + "px";
      flying.innerHTML = imgEl ? '<img src="' + imgEl.src + '" alt=""/>' : '<i class="ti ti-shopping-cart-plus"></i>';
      document.body.appendChild(flying);

      requestAnimationFrame(function () {
        flying.style.left = (endRect.left + endRect.width / 2 - 10) + "px";
        flying.style.top = (endRect.top + endRect.height / 2 - 10) + "px";
        flying.style.width = "20px";
        flying.style.height = "20px";
        flying.style.opacity = "0.2";
      });

      setTimeout(function () {
        flying.remove();
        cartIcon.classList.remove("ec-cart-bump");
        void cartIcon.offsetWidth;
        cartIcon.classList.add("ec-cart-bump");
      }, 550);
    } catch (e) { /* animation is decorative — never block the actual add-to-cart */ }
  }

  /* ---------- Button ripple (delegated, no per-page wiring needed) ---------- */
  document.addEventListener("click", function (e) {
    const btn = e.target.closest(".btn-enquire, .btn-add-cart, .btn-orange, .btn-cart-checkout, .btn-pdp-cart, .qv-add-cart-btn, .wishlist-add-cart-btn, .btn-call, .btn-wa-product, .order-reorder-btn");
    if (!btn || btn.disabled) return;
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement("span");
    const size = Math.max(rect.width, rect.height);
    ripple.className = "ec-ripple";
    ripple.style.width = ripple.style.height = size + "px";
    ripple.style.left = (e.clientX - rect.left - size / 2) + "px";
    ripple.style.top = (e.clientY - rect.top - size / 2) + "px";
    const prevPosition = getComputedStyle(btn).position;
    if (prevPosition === "static") btn.style.position = "relative";
    btn.style.overflow = "hidden";
    btn.appendChild(ripple);
    setTimeout(function () { ripple.remove(); }, 600);
  });

  /**
   * Convenience wrapper for "Add to Cart" buttons: adds the item,
   * shows the success toast, and flashes the clicked button to
   * "✓ Added" for 2 seconds before reverting — used by both pages.
   */
  function addToCartUI(btnEl, item, qty) {
    addToCart(item, qty);
    showToast("Added to Cart Successfully");
    if (btnEl) {
      flyToCart(btnEl, item);
      const prevHtml = btnEl.innerHTML;
      btnEl.classList.add("added");
      btnEl.innerHTML = '<i class="ti ti-check"></i> Added';
      btnEl.disabled = true;
      setTimeout(function () {
        btnEl.innerHTML = prevHtml;
        btnEl.classList.remove("added");
        btnEl.disabled = false;
      }, 2000);
    }
  }

  load();

  ns.cart = {
    addToCart: addToCart,
    addToCartUI: addToCartUI,
    updateQty: updateQty,
    removeItem: removeItem,
    clearCart: clearCart,
    getCart: getCart,
    getCount: getCount,
    getTotal: getTotal,
    getTotalMRP: getTotalMRP,
    getTotalSavings: getTotalSavings,
    getCurrency: getCurrency,
    hasCallForPrice: hasCallForPrice,
    onChange: onChange
  };
  ns.showToast = showToast;
  ns.flyToCart = flyToCart;
})(window.EcoConnex);
