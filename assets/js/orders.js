/* ============================================================
   Eco Connex — Order History ("My Orders") module.
   Saves a local copy of each WhatsApp order on THIS device/
   browser only (no login, no server, no database — matches
   the site's existing localStorage-based cart/checkout).
   Used by: checkout.js (saves an order after WhatsApp opens)
   and orders.html (displays history + "Reorder" button).
   ============================================================ */
window.EcoConnex = window.EcoConnex || {};

(function (ns) {
  "use strict";

  const STORAGE_KEY = "ecoconnex_orders_v1";
  const MAX_ORDERS = 25; // keep the list from growing unbounded on one device

  function loadOrders() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function persistOrders(orders) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(orders)); } catch (e) { /* ignore (storage full/disabled) */ }
  }

  /**
   * Saves a completed order to local history.
   * @param {Array} items - cart items at time of order (name, sku, price, mrp, currency, icon, image, qty)
   * @param {Object} totals - { count, total, hasCallForPrice }
   * @param {Object} details - { name, mobile, address, gst } — used only to show "Delivered to" on the order card
   */
  function saveOrder(items, totals, details) {
    if (!items || !items.length) return;
    const orders = loadOrders();
    const order = {
      id: "ORD" + Date.now(),
      date: new Date().toISOString(),
      items: items.map(function (i) {
        return { name: i.name, sku: i.sku, price: i.price, mrp: i.mrp, currency: i.currency || "INR", icon: i.icon, image: i.image, qty: i.qty };
      }),
      count: totals && typeof totals.count === "number" ? totals.count : items.reduce(function (s, i) { return s + i.qty; }, 0),
      total: totals && typeof totals.total === "number" ? totals.total : items.reduce(function (s, i) { return s + (i.price || 0) * i.qty; }, 0),
      hasCallForPrice: !!(totals && totals.hasCallForPrice),
      address: details && details.address ? details.address : ""
    };
    orders.unshift(order); // newest first
    if (orders.length > MAX_ORDERS) orders.length = MAX_ORDERS;
    persistOrders(orders);
  }

  function getOrders() {
    return loadOrders();
  }

  function clearOrders() {
    persistOrders([]);
  }

  function getOrderCount() {
    return loadOrders().length;
  }

  ns.orders = {
    saveOrder: saveOrder,
    getOrders: getOrders,
    clearOrders: clearOrders,
    getOrderCount: getOrderCount
  };
})(window.EcoConnex);
