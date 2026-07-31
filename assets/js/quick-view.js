/* ============================================================
   Eco Connex — Quick View modal.
   Lets a customer preview a product (image, price, GST/warranty/
   stock badges, Add to Cart) without leaving the products grid.
   Used by: products.html and index.html (Featured Products).
   Injects its own modal markup once, same pattern as
   checkout.js's shared modal.
   ============================================================ */
window.EcoConnex = window.EcoConnex || {};

(function (ns) {
  "use strict";

  let injected = false;
  let qvQty = 1;
  let currentProduct = null;

  const MODAL_HTML =
    '<div class="qv-overlay" id="qvOverlay">' +
      '<div class="qv-modal" role="dialog" aria-modal="true" aria-labelledby="qvTitle">' +
        '<button class="qv-close" id="qvClose" type="button" aria-label="Close quick view">&times;</button>' +
        '<div class="qv-body" id="qvBody"></div>' +
      "</div>" +
    "</div>";

  function inject() {
    if (injected) return;
    const wrap = document.createElement("div");
    wrap.innerHTML = MODAL_HTML;
    document.body.appendChild(wrap.firstElementChild);
    injected = true;

    document.getElementById("qvClose").addEventListener("click", close);
    document.getElementById("qvOverlay").addEventListener("click", function (e) {
      if (e.target.id === "qvOverlay") close();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && document.getElementById("qvOverlay").classList.contains("open")) close();
    });
  }

  function close() {
    document.getElementById("qvOverlay").classList.remove("open");
    document.body.style.overflow = "";
  }

  function renderBody(p) {
    const hasPrice = typeof p.price === "number" && p.price > 0;
    const outOfStock = ns.isOutOfStock(p);
    const stockCls = ns.getStockClass(p.stock);

    let html = '<div class="qv-gallery">' + ns.renderProductImageHtml(p, { width: 320, height: 320 }) + "</div>";
    html += '<div class="qv-info">';
    html += '<span class="qv-stock-badge ' + stockCls + '">' + ns.escapeHtml(p.stock) + "</span>";
    html += '<h2 id="qvTitle" class="qv-name">' + ns.escapeHtml(p.name) + "</h2>";
    html += '<div class="qv-meta">SKU: ' + ns.escapeHtml(p.sku) + " · " + ns.escapeHtml(p.categoryLabel || p.category) + "</div>";
    html += ns.renderPriceHtml(p, { hideSavingsLine: true });

    html += '<div class="qv-trust-badges">';
    if (typeof p.gstPercent === "number" && p.gstPercent > 0) html += '<span class="qv-mini-badge"><i class="ti ti-receipt-tax"></i> GST ' + p.gstPercent + '% Included</span>';
    if (p.warranty) html += '<span class="qv-mini-badge"><i class="ti ti-certificate"></i> ' + ns.escapeHtml(p.warranty) + " Warranty</span>";
    html += "</div>";

    if (!outOfStock) {
      html +=
        '<div class="qv-qty-row">' +
          '<div class="qv-qty">' +
            '<button type="button" id="qvQtyMinus" aria-label="Decrease quantity">−</button>' +
            '<span class="qv-qty-num" id="qvQtyNum">1</span>' +
            '<button type="button" id="qvQtyPlus" aria-label="Increase quantity">+</button>' +
          "</div>" +
        "</div>";
    }

    html += '<div class="qv-actions">';
    html += outOfStock
      ? '<button class="qv-add-cart-btn" disabled><i class="ti ti-ban"></i> Out of Stock</button>'
      : '<button class="qv-add-cart-btn" id="qvAddCart"><i class="ti ti-shopping-cart-plus"></i> Add to Cart</button>';
    html += '<a class="qv-view-full-btn" href="product.html?id=' + p.id + '">View Full Details <i class="ti ti-arrow-right"></i></a>';
    html += "</div>";
    html += "</div>";

    document.getElementById("qvBody").innerHTML = html;

    if (!outOfStock) {
      const qtyNum = document.getElementById("qvQtyNum");
      document.getElementById("qvQtyMinus").addEventListener("click", function () {
        if (qvQty > 1) { qvQty--; qtyNum.textContent = qvQty; }
      });
      document.getElementById("qvQtyPlus").addEventListener("click", function () {
        qvQty++; qtyNum.textContent = qvQty;
      });
      document.getElementById("qvAddCart").addEventListener("click", function () {
        const item = { id: p.id, name: p.name, sku: p.sku, price: hasPrice ? p.price : null, mrp: hasPrice ? p.mrp : null, currency: p.currency || "INR", icon: p.icon, image: p.image };
        ns.cart.addToCart(item, qvQty);
        ns.showToast("Added to Cart Successfully");
      });
    }
  }

  function openQuickView(id) {
    inject();
    qvQty = 1;
    ns.loadProducts().then(function (products) {
      const p = ns.getProductById(products, id);
      if (!p) return;
      currentProduct = p;
      renderBody(p);
      document.getElementById("qvOverlay").classList.add("open");
      document.body.style.overflow = "hidden";
    });
  }

  ns.openQuickView = openQuickView;
})(window.EcoConnex);
