/* ============================================================
   Eco Connex — Wishlist module.
   Same pattern as cart.js: localStorage only, no login, no
   server. Lets a customer save products to look at or buy
   later. Used by: product cards (index.html, products.html),
   the PDP (product-detail.js), and wishlist.html.
   ============================================================ */
window.EcoConnex = window.EcoConnex || {};

(function (ns) {
  "use strict";

  const STORAGE_KEY = "ecoconnex_wishlist_v1";
  let list = load();
  let listeners = [];

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch (e) { /* ignore */ }
    listeners.forEach(function (fn) { fn(list.slice()); });
  }

  function onChange(fn) {
    listeners.push(fn);
  }

  function isInWishlist(sku) {
    return list.some(function (i) { return i.sku === sku; });
  }

  function addToWishlist(item) {
    if (isInWishlist(item.sku)) return;
    list.push({
      id: item.id,
      name: item.name,
      sku: item.sku,
      price: (typeof item.price === "number" && item.price > 0) ? item.price : null,
      mrp: (typeof item.mrp === "number" && item.mrp > 0) ? item.mrp : null,
      currency: item.currency || "INR",
      icon: item.icon || "🔧",
      image: item.image || null,
      addedAt: new Date().toISOString()
    });
    persist();
  }

  function removeFromWishlist(sku) {
    list = list.filter(function (i) { return i.sku !== sku; });
    persist();
  }

  function toggleWishlist(item) {
    if (isInWishlist(item.sku)) {
      removeFromWishlist(item.sku);
      return false;
    }
    addToWishlist(item);
    return true;
  }

  function getWishlist() { return list.slice(); }
  function getWishlistCount() { return list.length; }
  function clearWishlist() { list = []; persist(); }

  ns.wishlist = {
    addToWishlist: addToWishlist,
    removeFromWishlist: removeFromWishlist,
    toggleWishlist: toggleWishlist,
    isInWishlist: isInWishlist,
    getWishlist: getWishlist,
    getWishlistCount: getWishlistCount,
    clearWishlist: clearWishlist,
    onChange: onChange
  };
})(window.EcoConnex);
