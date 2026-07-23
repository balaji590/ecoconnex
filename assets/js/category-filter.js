/* ============================================================
   Eco Connex — Home Page: Featured Products
   The full product catalog (search, filter, all 135 products,
   and the granular category chips) lives entirely on products.html.
   This file only powers the Home Page's Featured Products grid —
   up to 8 products, reusing the exact same card markup/behaviour
   as the Products page (Add to Cart, WhatsApp, qty stepper,
   pricing/discount, image rendering). Prefers products marked
   featured:true and gracefully falls back to the first 8 products
   when that field isn't present yet (see getFeaturedProducts() in
   products-data.js) — no product IDs are ever hardcoded here.
   ============================================================ */
(function () {
  "use strict";

  const grid = document.getElementById("featuredProductsGrid");
  const emptyState = document.getElementById("featuredProductsEmpty");
  if (!grid) return; // widget not present on this page

  let allProducts = [];

  /* ---------- Product Card (reused as-is from the Products page) ---------- */

  function cardHtml(p) {
    const hasPrice = typeof p.price === "number" && p.price > 0;
    const priceBlock = window.EcoConnex.renderPriceHtml(p, { hideSavingsLine: true });
    const outOfStock = window.EcoConnex.isOutOfStock(p);
    const itemJson = window.EcoConnex.escapeHtml(JSON.stringify({ name: p.name, sku: p.sku, price: hasPrice ? p.price : null, mrp: hasPrice ? p.mrp : null, currency: p.currency || "INR", icon: p.icon, image: p.image }));
    const qtyId = "tqty-home-" + p.id;
    const qtyStepper =
      '<div class="tile-qty" onclick="event.stopPropagation()">' +
        '<button type="button" aria-label="Decrease quantity" onclick="var el=document.getElementById(\'' + qtyId + '\');el.textContent=Math.max(1,parseInt(el.textContent,10)-1);">−</button>' +
        '<span class="tile-qty-num" id="' + qtyId + '">1</span>' +
        '<button type="button" aria-label="Increase quantity" onclick="var el=document.getElementById(\'' + qtyId + '\');el.textContent=parseInt(el.textContent,10)+1;">+</button>' +
      "</div>";
    const actionBtn = outOfStock
      ? '<button class="btn-add-cart" disabled style="opacity:0.5;cursor:not-allowed;"><i class="ti ti-ban"></i> Out of Stock</button>'
      : '<button class="btn-add-cart" onclick="var q=parseInt(document.getElementById(\'' + qtyId + '\').textContent,10)||1;EcoConnex.cart.addToCartUI(this, JSON.parse(this.getAttribute(\'data-item\')), q);document.getElementById(\'' + qtyId + '\').textContent=\'1\';" data-item="' + itemJson + '"><i class="ti ti-shopping-cart-plus"></i> Add</button>';
    const badgeBg = outOfStock ? "#6b7280" : (window.EcoConnex.getStockClass(p.stock) === "in-stock" ? "var(--orange)" : "#6b7280");

    return (
      '<article class="product-card" id="home-product-' + p.id + '" onclick="if(!event.target.closest(\'button\')){window.location.href=\'product.html?id=' + p.id + '\';}" style="cursor:pointer;">' +
        '<div class="product-img">' + window.EcoConnex.renderProductImageHtml(p, { width: 280, height: 280 }) + '<span class="product-badge" style="background:' + badgeBg + '">' + window.EcoConnex.escapeHtml(p.stock) + "</span></div>" +
        '<div class="product-body">' +
          '<h3 class="product-name">' + window.EcoConnex.escapeHtml(p.name) + "</h3>" +
          '<p class="product-desc">' + window.EcoConnex.escapeHtml(p.shortDescription || window.EcoConnex.shortText(p.description, 90)) + "</p>" +
          '<span class="product-compat">' + window.EcoConnex.escapeHtml(p.categoryLabel || p.category) + " · " + window.EcoConnex.escapeHtml(p.sku) + "</span>" +
          priceBlock +
          (outOfStock ? "" : qtyStepper) +
          '<div class="product-actions">' +
            actionBtn +
            '<button class="btn-wa-product" onclick="waEnquiry(\'' + p.name.replace(/'/g, "\\'") + '\')"><i class="ti ti-brand-whatsapp"></i></button>' +
          "</div>" +
        "</div>" +
      "</article>"
    );
  }

  /* ---------- Featured Products grid (8 items, reused card) ---------- */

  function renderFeatured() {
    const results = window.EcoConnex.getFeaturedProducts(allProducts, 8);
    if (!results.length) {
      grid.innerHTML = "";
      if (emptyState) emptyState.classList.add("show");
      return;
    }
    if (emptyState) emptyState.classList.remove("show");
    grid.innerHTML = results.map(cardHtml).join("");
  }

  /* ---------- Slider arrow navigation ---------- */

  function wireSliderArrows() {
    const prevBtn = document.getElementById("featuredPrev");
    const nextBtn = document.getElementById("featuredNext");
    if (!prevBtn || !nextBtn) return;
    const scrollAmount = function () {
      const card = grid.querySelector(".product-card");
      return card ? card.getBoundingClientRect().width + 20 : 280;
    };
    prevBtn.addEventListener("click", function () {
      grid.scrollBy({ left: -scrollAmount(), behavior: "smooth" });
    });
    nextBtn.addEventListener("click", function () {
      grid.scrollBy({ left: scrollAmount(), behavior: "smooth" });
    });
  }

  /* ---------- Hero Category Cards (dynamic, never hardcoded) ----------
     Reads real categories straight from the loaded product catalog.
     Prefers a curated list of core EV component types (by business
     relevance), but only ever shows a category that actually has
     products right now — if one of the preferred types doesn't exist
     in the catalog, it's skipped automatically and the next best real
     category takes its place. Each card links to its real filtered
     listing on products.html (uses the same ?category= raw-category
     slug the Products page's own filter chips already use). */

  const HERO_CATEGORY_PRIORITY = [
    { match: ["motor"], label: "Hub Motors", subtitle: "High Efficiency", icon: "⚙️" },
    { match: ["charger"], label: "Chargers", subtitle: "Fast Charging", icon: "🔌" },
    { match: ["disc", "brake", "brake-shoe", "drum-plate"], label: "Brake Parts", subtitle: "Reliable Safety", icon: "🛑" },
    { match: ["throttle"], label: "Throttle Controls", subtitle: "Smooth Control", icon: "🎮" },
    { match: ["controller"], label: "Controllers", subtitle: "Smart Performance", icon: "🎛️" },
    { match: ["connector"], label: "Connectors", subtitle: "Genuine Parts", icon: "🔗" },
    { match: ["switch"], label: "Switches", subtitle: "OEM Quality", icon: "🎚️" },
    { match: ["bearing"], label: "Bearings", subtitle: "Heavy Duty", icon: "⚪" }
  ];

  function heroCardHtml(entry, index) {
    return (
      '<a href="products.html?category=' + encodeURIComponent(entry.category) + '" class="hero-float-card card-' + (index + 1) + '" aria-label="Browse ' + window.EcoConnex.escapeHtml(entry.label) + '">' +
        '<span class="hero-float-icon" aria-hidden="true">' + entry.icon + "</span>" +
        "<div>" +
          '<div class="hero-float-name">' + window.EcoConnex.escapeHtml(entry.label) + "</div>" +
          '<div class="hero-float-sub">' + window.EcoConnex.escapeHtml(entry.subtitle) + "</div>" +
          '<div class="hero-float-cta">Explore <i class="ti ti-arrow-right"></i></div>' +
        "</div>" +
      "</a>"
    );
  }

  function renderHeroCategoryCards(products) {
    const container = document.getElementById("heroCategoryCards");
    if (!container) return;

    // Real category counts from the actual catalog — never assumed.
    const counts = {};
    products.forEach(function (p) {
      if (!p.category) return;
      counts[p.category] = (counts[p.category] || 0) + 1;
    });

    const chosen = [];
    const usedCategories = {};

    // 1) Fill from the curated priority list, but only categories that truly exist.
    HERO_CATEGORY_PRIORITY.forEach(function (entry) {
      if (chosen.length >= 4) return;
      // Pick the highest-count real category among this entry's acceptable matches.
      let best = null;
      entry.match.forEach(function (cat) {
        if (counts[cat] && !usedCategories[cat] && (!best || counts[cat] > counts[best])) best = cat;
      });
      if (best) {
        chosen.push({ category: best, label: entry.label, subtitle: entry.subtitle, icon: entry.icon });
        usedCategories[best] = true;
      }
    });

    // 2) If fewer than 4 preferred categories exist yet, fill remaining slots
    //    from whatever real categories have the most products (still real data only).
    if (chosen.length < 4) {
      const bySize = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; });
      for (let i = 0; i < bySize.length && chosen.length < 4; i++) {
        const cat = bySize[i];
        if (usedCategories[cat]) continue;
        const sample = products.find(function (p) { return p.category === cat; });
        chosen.push({
          category: cat,
          label: sample ? (sample.categoryLabel || cat) : cat,
          subtitle: "Genuine Parts",
          icon: "🔧"
        });
        usedCategories[cat] = true;
      }
    }

    container.innerHTML = chosen.map(function (entry, i) { return heroCardHtml(entry, i); }).join("");
  }

  window.EcoConnex.loadProducts().then(function (products) {
    allProducts = products;
    renderFeatured();
    wireSliderArrows();
    renderHeroCategoryCards(products);
  });
})();
