/* ============================================================
   Eco Connex — "My Wishlist" page rendering logic.
   Reads saved items from wishlist.js, cross-references live
   product data (products-data.js) for up-to-date stock status,
   and renders a premium card grid with "Add to Cart" and
   "Remove from Wishlist" actions.
   ============================================================ */
(function () {
  "use strict";

  const root = document.getElementById("wishlistRoot");
  if (!root) return;

  const EC = window.EcoConnex;

  function setHeroCount(n) {
    const el = document.getElementById("wishlistHeroCount");
    if (el) el.textContent = n + (n === 1 ? " Saved Product" : " Saved Products");
  }

  function stockBadgeHtml(stockLabel) {
    if (!stockLabel) return "";
    const cls = EC.getStockClass(stockLabel);
    return '<span class="wl-stock-badge ' + cls + '">' + EC.escapeHtml(stockLabel) + "</span>";
  }

  function itemCardHtml(item) {
    const hasPrice = typeof item.price === "number" && item.price > 0;
    const offer = hasPrice ? EC.getOffer(item) : null;
    const priceHtml = hasPrice
      ? '<div class="wishlist-card-price-row"><span class="wishlist-card-price">₹' + item.price.toLocaleString("en-IN") + "</span>" +
          (offer ? '<span class="wishlist-card-mrp">₹' + item.mrp.toLocaleString("en-IN") + "</span><span class=\"wishlist-card-discount-pct\">" + offer.percent + "% off</span>" : "") +
        "</div>"
      : '<div class="wishlist-card-price-row"><span class="wishlist-item-call">Price on Request</span></div>';
    const discountBadge = offer ? '<span class="wishlist-discount-badge">' + offer.percent + '% OFF</span>' : "";
    const outOfStock = item.stock && EC.getStockClass(item.stock) === "out-of-stock";
    return (
      '<div class="wishlist-card" data-sku="' + EC.escapeHtml(item.sku) + '">' +
        '<div class="wishlist-card-img">' +
          discountBadge +
          '<button class="wishlist-heart-remove-btn" data-sku="' + EC.escapeHtml(item.sku) + '" aria-label="Remove from wishlist" title="Remove from wishlist"><i class="ti ti-heart-filled"></i></button>' +
          '<a href="product.html?id=' + item.id + '">' + EC.renderProductImageHtml(item, { width: 220, height: 220 }) + "</a>" +
        "</div>" +
        '<div class="wishlist-card-body">' +
          stockBadgeHtml(item.stock) +
          '<a class="wishlist-card-name" href="product.html?id=' + item.id + '">' + EC.escapeHtml(item.name) + "</a>" +
          priceHtml +
          (outOfStock
            ? '<button class="wishlist-add-cart-btn" disabled><i class="ti ti-ban"></i> Out of Stock</button>'
            : '<button class="wishlist-add-cart-btn" data-sku="' + EC.escapeHtml(item.sku) + '"><i class="ti ti-shopping-cart-plus"></i> Add to Cart</button>') +
          '<button class="wishlist-remove-link" data-sku="' + EC.escapeHtml(item.sku) + '">Remove from Wishlist</button>' +
        "</div>" +
      "</div>"
    );
  }

  function renderEmpty() {
    setHeroCount(0);
    root.innerHTML =
      '<div class="wishlist-empty">' +
        '<div class="wishlist-empty-illustration"><i class="ti ti-heart"></i></div>' +
        "<h3>Your wishlist is empty</h3>" +
        "<p>Save your favourite EV spare parts and access them anytime.</p>" +
        '<a href="products.html" class="wishlist-empty-btn"><i class="ti ti-packages"></i> Explore Products</a>' +
      "</div>";
  }

  function wireCardActions(items) {
    root.querySelectorAll(".wishlist-add-cart-btn:not([disabled])").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const sku = btn.getAttribute("data-sku");
        const item = items.find(function (i) { return i.sku === sku; });
        if (!item) return;
        EC.cart.addToCart({ name: item.name, sku: item.sku, price: item.price, mrp: item.mrp, currency: item.currency, icon: item.icon, image: item.image }, 1);
        EC.showToast("Added to cart");
        EC.flyToCart(btn, item);
      });
    });

    function wireRemove(selector) {
      root.querySelectorAll(selector).forEach(function (btn) {
        btn.addEventListener("click", function () {
          const sku = btn.getAttribute("data-sku");
          EC.wishlist.removeFromWishlist(sku);
          render();
        });
      });
    }
    wireRemove(".wishlist-heart-remove-btn");
    wireRemove(".wishlist-remove-link");
  }

  function render() {
    const saved = EC.wishlist.getWishlist();
    if (!saved.length) { renderEmpty(); return; }

    setHeroCount(saved.length);

    EC.loadProducts().then(function (allProducts) {
      const items = saved.map(function (savedItem) {
        const live = EC.getProductById(allProducts, savedItem.id);
        if (!live) return savedItem;
        return {
          id: live.id, name: live.name, sku: live.sku,
          price: live.price, mrp: live.mrp, currency: live.currency,
          icon: live.icon, image: live.image, stock: live.stock
        };
      });

      root.innerHTML = '<div class="wishlist-list">' + items.map(itemCardHtml).join("") + "</div>";
      wireCardActions(items);
    });
  }

  render();
})();
