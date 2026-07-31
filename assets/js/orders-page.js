/* ============================================================
   Eco Connex — "My Orders" page rendering logic.
   Reads local order history from orders.js and renders premium
   cards: preview thumbnails (max 4 + "+N more"), a "View
   Details" toggle to expand the full item list, and a
   one-click "Reorder" button.
   ============================================================ */
(function () {
  "use strict";

  const root = document.getElementById("ordersRoot");
  if (!root) return;

  const EC = window.EcoConnex;
  const PREVIEW_LIMIT = 4;

  function setHeroCount(n) {
    const el = document.getElementById("ordersHeroCount");
    if (el) el.textContent = n + (n === 1 ? " Order" : " Orders");
  }

  function formatDate(iso) {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) +
        " · " + d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    } catch (e) {
      return "";
    }
  }

  function previewThumbHtml(item) {
    return '<div class="order-preview-thumb">' + EC.renderProductImageHtml(item, { width: 56, height: 56 }) + "</div>";
  }

  function fullItemRow(item) {
    const priceLine = (typeof item.price === "number" && item.price > 0)
      ? "₹" + (item.price * item.qty).toLocaleString("en-IN")
      : "Price on Request";
    return (
      '<div class="order-full-item-row">' +
        '<div class="order-full-item-img">' + EC.renderProductImageHtml(item, { width: 44, height: 44 }) + "</div>" +
        '<div class="order-full-item-info">' +
          '<div class="order-full-item-name">' + EC.escapeHtml(item.name) + "</div>" +
          '<div class="order-full-item-qty">Qty: ' + item.qty + "</div>" +
        "</div>" +
        '<div class="order-full-item-price">' + priceLine + "</div>" +
      "</div>"
    );
  }

  function orderCardHtml(order) {
    const previewItems = order.items.slice(0, PREVIEW_LIMIT);
    const extraCount = order.items.length - PREVIEW_LIMIT;
    const previewHtml = previewItems.map(previewThumbHtml).join("") +
      (extraCount > 0 ? '<div class="order-preview-more">+' + extraCount + " more</div>" : "");
    const totalLine = order.hasCallForPrice
      ? "₹" + order.total.toLocaleString("en-IN") + " + items to confirm"
      : "₹" + order.total.toLocaleString("en-IN");
    const fullListHtml = '<div class="order-full-items" id="orderFull-' + order.id + '">' + order.items.map(fullItemRow).join("") + "</div>";

    return (
      '<div class="order-card">' +
        '<div class="order-card-head">' +
          '<div>' +
            '<span class="order-id">' + EC.escapeHtml(order.id) + "</span>" +
            '<span class="order-date">' + formatDate(order.date) + "</span>" +
          "</div>" +
          '<div class="order-total">' + totalLine + "</div>" +
        "</div>" +
        '<div class="order-preview-row">' + previewHtml + "</div>" +
        fullListHtml +
        '<div class="order-card-actions">' +
          '<button class="order-details-btn" data-order-id="' + EC.escapeHtml(order.id) + '"><i class="ti ti-chevron-down"></i> View Details</button>' +
          '<button class="order-reorder-btn" data-order-id="' + EC.escapeHtml(order.id) + '"><i class="ti ti-rotate-clockwise"></i> Reorder</button>' +
        "</div>" +
      "</div>"
    );
  }

  function renderEmpty() {
    setHeroCount(0);
    root.innerHTML =
      '<div class="orders-empty">' +
        '<div class="orders-empty-illustration"><i class="ti ti-package"></i></div>' +
        "<h3>You haven't placed any orders yet</h3>" +
        "<p>Start shopping and your orders will appear here.</p>" +
        '<a href="products.html" class="orders-empty-btn"><i class="ti ti-packages"></i> Browse Products</a>' +
      "</div>";
  }

  function render() {
    const orders = EC.orders.getOrders();
    if (!orders.length) { renderEmpty(); return; }

    setHeroCount(orders.length);

    root.innerHTML =
      '<div class="orders-list">' + orders.map(orderCardHtml).join("") + "</div>" +
      '<div class="orders-clear-row"><a href="javascript:void(0)" id="clearOrdersLink">Clear order history from this device</a></div>';

    root.querySelectorAll(".order-details-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const orderId = btn.getAttribute("data-order-id");
        const fullList = document.getElementById("orderFull-" + orderId);
        const isOpen = fullList.classList.toggle("open");
        btn.classList.toggle("open", isOpen);
        btn.innerHTML = isOpen
          ? '<i class="ti ti-chevron-up"></i> Hide Details'
          : '<i class="ti ti-chevron-down"></i> View Details';
      });
    });

    root.querySelectorAll(".order-reorder-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const orderId = btn.getAttribute("data-order-id");
        const order = orders.find(function (o) { return o.id === orderId; });
        if (!order) return;
        order.items.forEach(function (item) {
          EC.cart.addToCart({ name: item.name, sku: item.sku, price: item.price, mrp: item.mrp, currency: item.currency, icon: item.icon, image: item.image }, item.qty);
        });
        EC.showToast("Items added to cart from this order");
        if (typeof window.openCart === "function") window.openCart();
      });
    });

    const clearLink = document.getElementById("clearOrdersLink");
    if (clearLink) {
      clearLink.addEventListener("click", function () {
        if (window.confirm("Clear your order history from this device? This cannot be undone.")) {
          EC.orders.clearOrders();
          render();
        }
      });
    }
  }

  render();
})();
