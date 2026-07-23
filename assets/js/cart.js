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
    const t = document.createElement("div");
    t.style.cssText = "position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:#111;color:#fff;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:600;z-index:9999;border-left:3px solid #f97316;white-space:nowrap;box-shadow:0 8px 24px rgba(0,0,0,0.3);";
    t.textContent = "✓ " + msg;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2500);
  }

  /**
   * Convenience wrapper for "Add to Cart" buttons: adds the item,
   * shows the success toast, and flashes the clicked button to
   * "✓ Added" for 2 seconds before reverting — used by both pages.
   */
  function addToCartUI(btnEl, item, qty) {
    addToCart(item, qty);
    showToast("Added to Cart Successfully");
    if (btnEl) {
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
})(window.EcoConnex);
