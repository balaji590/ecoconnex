/* ============================================================
   Eco Connex — Product Details Page (PDP) logic.
   Reuses: products-data.js (product source, category grouping,
   related-products, recently-viewed) and cart.js (Add to Cart).
   No product data or cart logic is duplicated here.
   ============================================================ */
(function () {
  "use strict";

  const root = document.getElementById("pdpRoot");
  if (!root) return;

  const EC = window.EcoConnex;
  let qty = 1;
  let currentProduct = null;

  function getIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
  }

  function stockClass(stock) {
    const s = (stock || "").toLowerCase();
    if (s.indexOf("low") !== -1) return "low";
    if (s.indexOf("enquire") !== -1) return "enquire";
    return "in-stock";
  }

  function priceHtml(p, big) {
    const cls = big ? "pdp-price" : "mini-card-price";
    if (typeof p.price === "number" && p.price > 0) {
      return '<div class="' + cls + '">₹' + p.price.toLocaleString("en-IN") + "</div>";
    }
    return '<div class="' + cls + ' call">' + EC.escapeHtml(p.priceDisplay || "Call for Price") + "</div>";
  }

  /* ---------- Related / recently-viewed mini cards ---------- */
  function miniCardHtml(p) {
    return (
      '<div class="mini-card" onclick="window.location.href=\'product.html?id=' + p.id + '\'">' +
        '<div class="mini-card-img">' + p.image + "</div>" +
        '<div class="mini-card-body">' +
          '<div class="mini-card-name">' + EC.escapeHtml(p.name) + "</div>" +
          priceHtml(p, false) +
        "</div>" +
      "</div>"
    );
  }

  function renderStrip(containerId, title, products) {
    const el = document.getElementById(containerId);
    if (!products.length) { el.closest(".pdp-strip").style.display = "none"; return; }
    el.innerHTML = products.map(miniCardHtml).join("");
  }

  /* ---------- Description-section content helpers ---------- */
  function buildFeatures(p) {
    const feats = [
      "Genuine OEM-grade " + (p.categoryLabel || p.category).toLowerCase() + " built for durability",
      "Precision-tested fit for Indian electric two-wheelers",
      "Backed by Eco Connex quality assurance",
    ];
    if (p.stock && p.stock.toLowerCase().indexOf("enquire") === -1) feats.push("Ready to ship — " + p.stock.toLowerCase());
    return feats;
  }

  function buildSpecs(p) {
    return [
      ["SKU", p.sku],
      ["Category", p.categoryLabel || p.category],
      ["Brand", p.brand],
      ["Availability", p.stock]
    ];
  }

  /* ---------- Main render ---------- */
  function render(product, allProducts) {
    currentProduct = product;
    qty = 1;

    document.getElementById("pageTitle").textContent = product.name + " – Eco Connex";
    document.getElementById("pageDesc").setAttribute("content", product.description || product.name);

    document.getElementById("breadcrumb").innerHTML =
      '<a href="index.html">Home</a><i class="ti ti-chevron-right"></i>' +
      '<a href="products.html">Products</a><i class="ti ti-chevron-right"></i>' +
      '<a href="products.html?category=' + encodeURIComponent(product.category) + '">' + EC.escapeHtml(product.categoryLabel || product.category) + '</a><i class="ti ti-chevron-right"></i>' +
      '<span class="current">' + EC.escapeHtml(product.name) + "</span>";

    const sClass = stockClass(product.stock);
    const hasPrice = typeof product.price === "number" && product.price > 0;

    root.innerHTML =
      '<div class="pdp-grid">' +
        '<div class="pdp-gallery">' +
          '<div class="pdp-image-frame" id="zoomFrame"><span class="emoji-fallback">' + product.image + "</span></div>" +
          '<div class="pdp-thumbs"><div class="pdp-thumb active">' + product.image + "</div></div>" +
        "</div>" +
        '<div class="pdp-info">' +
          '<div class="pdp-info-badges">' +
            '<span class="pdp-badge cat">' + EC.escapeHtml(product.categoryLabel || product.category) + '</span>' +
            '<span class="pdp-badge stock ' + sClass + '">' + EC.escapeHtml(product.stock) + '</span>' +
          "</div>" +
          '<h1 class="pdp-title">' + EC.escapeHtml(product.name) + "</h1>" +
          '<div class="pdp-meta-row">' +
            '<span>SKU: <strong>' + EC.escapeHtml(product.sku) + '</strong></span>' +
            '<span>Brand: <strong>' + EC.escapeHtml(product.brand) + '</strong></span>' +
          "</div>" +
          '<div class="pdp-price-block">' + priceHtml(product, true) + "</div>" +
          '<p class="pdp-desc">' + EC.escapeHtml(product.description) + "</p>" +
          '<div class="pdp-qty-row">' +
            '<div class="pdp-qty">' +
              '<button id="qtyMinus" aria-label="Decrease quantity">−</button>' +
              '<div class="pdp-qty-num" id="qtyNum">1</div>' +
              '<button id="qtyPlus" aria-label="Increase quantity">+</button>' +
            "</div>" +
          "</div>" +
          '<div class="pdp-actions">' +
            '<button class="btn-pdp-cart" id="pdpAddToCart"><i class="ti ti-shopping-cart-plus"></i> Add to Cart</button>' +
            '<button class="btn-pdp-wa" id="pdpBuyWhatsApp"><i class="ti ti-brand-whatsapp"></i> Buy via WhatsApp</button>' +
          "</div>" +
          '<div class="pdp-trust-row">' +
            '<span><i class="ti ti-truck-delivery"></i> Fast delivery across Tamil Nadu</span>' +
            '<span><i class="ti ti-shield-check"></i> Genuine parts guarantee</span>' +
            '<span><i class="ti ti-receipt"></i> GST billing available</span>' +
          "</div>" +
        "</div>" +
      "</div>" +

      '<div class="pdp-sections">' +
        '<div class="pdp-section-card">' +
          '<h3><i class="ti ti-file-text"></i> Product Description</h3>' +
          "<p>" + EC.escapeHtml(product.description) + "</p>" +
        "</div>" +
        '<div class="pdp-section-card">' +
          '<h3><i class="ti ti-list-details"></i> Specifications</h3>' +
          '<table class="pdp-spec-table">' + buildSpecs(product).map(function (row) {
            return "<tr><td>" + EC.escapeHtml(row[0]) + "</td><td>" + EC.escapeHtml(row[1]) + "</td></tr>";
          }).join("") + "</table>" +
        "</div>" +
        '<div class="pdp-section-card">' +
          '<h3><i class="ti ti-sparkles"></i> Key Features</h3>' +
          '<ul class="pdp-feature-list">' + buildFeatures(product).map(function (f) {
            return '<li><i class="ti ti-circle-check"></i>' + EC.escapeHtml(f) + "</li>";
          }).join("") + "</ul>" +
        "</div>" +
        '<div class="pdp-section-card">' +
          '<h3><i class="ti ti-motorbike"></i> Compatible Vehicles</h3>' +
          "<p>Fits most electric scooters and bikes including Ola Electric, Ather Energy, Hero Electric, Ampere, TVS iQube, Bajaj Chetak, Okinawa and Pure EV. Please WhatsApp us your vehicle model to confirm exact fitment.</p>" +
        "</div>" +
        '<div class="pdp-section-card">' +
          '<h3><i class="ti ti-certificate"></i> Warranty Information</h3>' +
          "<p>Standard Eco Connex dealer warranty applies as per manufacturer terms. Contact us on WhatsApp for warranty claims or replacement support.</p>" +
        "</div>" +
      "</div>" +

      '<div class="pdp-strip">' +
        '<div class="pdp-strip-header"><h3>Related Products</h3></div>' +
        '<div class="pdp-strip-grid" id="relatedGrid"></div>' +
      "</div>" +
      '<div class="pdp-strip" id="recentlyViewedStrip">' +
        '<div class="pdp-strip-header"><h3>Recently Viewed</h3></div>' +
        '<div class="pdp-strip-grid" id="recentGrid"></div>' +
      "</div>";

    wireInteractions(product, hasPrice);

    const related = EC.getRelatedProducts(allProducts, product, 4);
    renderStrip("relatedGrid", "Related Products", related);

    const viewedIds = EC.getRecentlyViewed().filter(function (id) { return id !== product.id; });
    const viewedProducts = viewedIds.map(function (id) { return EC.getProductById(allProducts, id); }).filter(Boolean).slice(0, 6);
    renderStrip("recentGrid", "Recently Viewed", viewedProducts);

    EC.addRecentlyViewed(product.id);
  }

  function wireInteractions(product, hasPrice) {
    const qtyNum = document.getElementById("qtyNum");
    document.getElementById("qtyMinus").addEventListener("click", function () {
      if (qty > 1) { qty--; qtyNum.textContent = qty; }
    });
    document.getElementById("qtyPlus").addEventListener("click", function () {
      qty++; qtyNum.textContent = qty;
    });

    const cartBtn = document.getElementById("pdpAddToCart");
    cartBtn.addEventListener("click", function () {
      const item = { name: product.name, sku: product.sku, price: hasPrice ? product.price : null, icon: product.image };
      for (let i = 0; i < qty; i++) window.EcoConnex.cart.addToCart(item);
      window.EcoConnex.showToast("Added to Cart Successfully");
      const prevHtml = cartBtn.innerHTML;
      cartBtn.classList.add("added");
      cartBtn.innerHTML = '<i class="ti ti-check"></i> Added';
      cartBtn.disabled = true;
      setTimeout(function () {
        cartBtn.innerHTML = prevHtml;
        cartBtn.classList.remove("added");
        cartBtn.disabled = false;
      }, 2000);
    });

    document.getElementById("pdpBuyWhatsApp").addEventListener("click", function () {
      const priceLine = hasPrice ? "Price: ₹" + product.price.toLocaleString("en-IN") : "Price: Call for Price";
      const msg = "🛒 *Buy Request from Eco Connex Website*\n\n" +
        "Product: " + product.name + "\n" +
        "SKU: " + product.sku + "\n" +
        "Qty: " + qty + "\n" +
        priceLine + "\n\n" +
        "Website: https://ecoconnex.in\n\n" +
        "Please confirm availability and pricing.";
      window.open("https://wa.me/918778657912?text=" + encodeURIComponent(msg), "_blank");
    });

    // Zoom: desktop hover handled by CSS; mobile tap toggles zoom class.
    const frame = document.getElementById("zoomFrame");
    frame.addEventListener("click", function () {
      frame.classList.toggle("zoomed");
    });
  }

  function renderNotFound() {
    root.innerHTML =
      '<div class="pdp-loading"><i class="ti ti-mood-sad" style="animation:none;"></i>Product not found.<br/><a href="products.html" style="color:var(--orange-dark);font-weight:600;">Browse all products →</a></div>';
    document.getElementById("breadcrumb").querySelector(".current").textContent = "Not found";
  }

  const id = getIdFromUrl();
  window.EcoConnex.loadProducts().then(function (products) {
    if (!id) { renderNotFound(); return; }
    const product = window.EcoConnex.getProductById(products, id);
    if (!product) { renderNotFound(); return; }
    render(product, products);
  });
})();
