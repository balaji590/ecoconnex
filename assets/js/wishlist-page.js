/* ============================================================
   Eco Connex — "My Wishlist" page rendering logic.
   Reads saved items from wishlist.js and renders cards with
   "Add to Cart" and "Remove" actions.
   ============================================================ */
(function () {
  "use strict";

  const root = document.getElementById("wishlistRoot");
  if (!root) return;

  const EC = window.EcoConnex;

  function itemCardHtml(item) {
    const hasPrice = typeof item.price === "number" && item.price > 0;
    const offer = hasPrice ? EC.getOffer(item) : null;
    const priceHtml = hasPrice
      ? '<div class="wishlist-card-price-row"><span class="wishlist-card-price">₹' + item.price.toLocaleString("en-IN") + "</span>" +
          (offer ? '<span class="wishlist-card-mrp">₹' + item.mrp.toLocaleString("en-IN") + "</span>" : "") +
        "</div>"
      : '<div class="wishlist-card-price-row"><span class="wishlist-item-call">Price on Request</span></div>';
    const discountBadge = offer ? '<span class="wishlist-discount-badge">' + offer.percent + '% off</span>' : "";
    return (
      '<div class="wishlist-card" data-sku="' + EC.escapeHtml(item.sku) + '">' +
        '<div class="wishlist-card-img">' +
          discountBadge +
          '<button class="wishlist-remove-btn" data-sku="' + EC.escapeHtml(item.sku) + '" aria-label="Remove from wishlist" title="Remove"><i class="ti ti-x"></i></button>' +
          '<a href="product.html?id=' + item.id + '">' + EC.renderProductImageHtml(item, { width: 160, height: 160 }) + "</a>" +
        "</div>" +
        '<div class="wishlist-card-body">' +
          '<a class="wishlist-card-name" href="product.html?id=' + item.id + '">' + EC.escapeHtml(item.name) + "</a>" +
          priceHtml +
          '<button class="btn-orange wishlist-add-cart-btn" data-sku="' + EC.escapeHtml(item.sku) + '"><i class="ti ti-shopping-cart-plus"></i> Add to cart</button>' +
        "</div>" +
      "</div>"
    );
  }

  function renderEmpty() {
    root.innerHTML =
      '<div class="wishlist-empty">' +
        '<i class="ti ti-heart-off"></i>' +
        "<h3>Your wishlist is empty</h3>" +
        "<p>Tap the heart icon on any product to save it here for later.</p>" +
        '<a href="products.html" class="btn-orange"><i class="ti ti-packages"></i> Browse Products</a>' +
      "</div>";
  }

  function render() {
    const items = EC.wishlist.getWishlist();
    if (!items.length) { renderEmpty(); return; }

    root.innerHTML = '<div class="wishlist-list">' + items.map(itemCardHtml).join("") + "</div>";

    root.querySelectorAll(".wishlist-add-cart-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const sku = btn.getAttribute("data-sku");
        const item = items.find(function (i) { return i.sku === sku; });
        if (!item) return;
        EC.cart.addToCart({ name: item.name, sku: item.sku, price: item.price, mrp: item.mrp, currency: item.currency, icon: item.icon, image: item.image }, 1);
        EC.showToast("Added to cart");
      });
    });

    root.querySelectorAll(".wishlist-remove-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const sku = btn.getAttribute("data-sku");
        EC.wishlist.removeFromWishlist(sku);
        render();
      });
    });
  }

  render();
})();
