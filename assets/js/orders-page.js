/* ============================================================
   Eco Connex — "My Orders" page rendering logic.
   Reads local order history from orders.js and renders cards
   with a one-click "Reorder" button that re-adds all items
   from that order back into the cart.
   ============================================================ */
(function () {
  "use strict";

  const root = document.getElementById("ordersRoot");
  if (!root) return;

  const EC = window.EcoConnex;

  function formatDate(iso) {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) +
        " · " + d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    } catch (e) {
      return "";
    }
  }

  function orderItemRow(item) {
    const priceLine = (typeof item.price === "number" && item.price > 0)
      ? "₹" + (item.price * item.qty).toLocaleString("en-IN")
      : "Price on Request";
    return (
      '<div class="order-item-row">' +
        '<div class="order-item-icon">' + EC.renderProductImageHtml(item, { width: 40, height: 40 }) + "</div>" +
        '<div class="order-item-info">' +
          '<div class="order-item-name">' + EC.escapeHtml(item.name) + "</div>" +
          '<div class="order-item-qty">Qty: ' + item.qty + "</div>" +
        "</div>" +
        '<div class="order-item-price">' + priceLine + "</div>" +
      "</div>"
    );
  }

  function orderCardHtml(order) {
    const itemsHtml = order.items.map(orderItemRow).join("");
    const totalLine = order.hasCallForPrice
      ? "₹" + order.total.toLocaleString("en-IN") + " + items to confirm"
      : "₹" + order.total.toLocaleString("en-IN");
    return (
      '<div class="order-card">' +
        '<div class="order-card-head">' +
          '<div><span class="order-id">' + EC.escapeHtml(order.id) + '</span><span class="order-date">' + formatDate(order.date) + "</span></div>" +
          '<div class="order-total">' + totalLine + "</div>" +
        "</div>" +
        '<div class="order-items">' + itemsHtml + "</div>" +
        '<div class="order-card-actions">' +
          '<button class="btn-orange order-reorder-btn" data-order-id="' + EC.escapeHtml(order.id) + '"><i class="ti ti-rotate-clockwise"></i> Reorder</button>' +
        "</div>" +
      "</div>"
    );
  }

  function renderEmpty() {
    root.innerHTML =
      '<div class="orders-empty">' +
        '<i class="ti ti-receipt-off"></i>' +
        "<h3>No orders yet</h3>" +
        "<p>Orders you place via WhatsApp checkout will show up here on this device.</p>" +
        '<a href="products.html" class="btn-orange"><i class="ti ti-packages"></i> Browse Products</a>' +
      "</div>";
  }

  function render() {
    const orders = EC.orders.getOrders();
    if (!orders.length) { renderEmpty(); return; }

    root.innerHTML =
      '<div class="orders-list">' + orders.map(orderCardHtml).join("") + "</div>" +
      '<div class="orders-clear-row"><a href="javascript:void(0)" id="clearOrdersLink">Clear order history from this device</a></div>';

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
