/* ============================================================
   Eco Connex — Category Navigation + Smart Product Filtering
   Renders the homepage category pill bar and product grid from
   the shared products.json data source, and combines the active
   category with the header search box (see search-widget.js →
   window.EcoConnex.onHeaderSearchChange hook).

   Reusable / future-ready:
   - Category grouping lives in products-data.js (CATEGORY_GROUPS)
   - Filtering goes through window.EcoConnex.applyFilters(), a
     generic pipeline. Adding a Brand/Price/Voltage/Vehicle filter
     later only needs a new registerFilter() call + a UI control
     that calls setActiveFilter() below — no rewrite required here.
   ============================================================ */
(function () {
  "use strict";

  const grid = document.getElementById("homeProductsGrid");
  const emptyState = document.getElementById("homeProductsEmpty");
  const pillTrack = document.getElementById("categoryScroll");
  if (!grid || !pillTrack) return; // widget not present on this page

  let allProducts = [];
  const activeFilters = { categoryGroup: "all", search: "" };

  function stockClass(stock) {
    const s = (stock || "").toLowerCase();
    if (s.indexOf("low") !== -1) return "low";
    if (s.indexOf("enquire") !== -1) return "enquire";
    return "in-stock";
  }

  function cardHtml(p) {
    const hasPrice = typeof p.price === "number" && p.price > 0;
    const priceBlock = hasPrice
      ? '<div class="product-price">₹' + p.price.toLocaleString("en-IN") + " <span>/ unit</span></div>"
      : '<div class="product-price" style="font-size:14px;color:var(--gray-500);">Call for price</div>';
    const itemJson = window.EcoConnex.escapeHtml(JSON.stringify({ name: p.name, sku: p.sku, price: hasPrice ? p.price : null, icon: p.image }));
    const actionBtn = '<button class="btn-add-cart" onclick="EcoConnex.cart.addToCartUI(this, JSON.parse(this.getAttribute(\'data-item\')))" data-item="' + itemJson + '"><i class="ti ti-shopping-cart-plus"></i> Add to Cart</button>';

    return (
      '<article class="product-card" id="home-product-' + p.id + '">' +
        '<div class="product-img">' + p.image + '<span class="product-badge" style="background:' + (stockClass(p.stock) === "in-stock" ? "var(--orange)" : "#6b7280") + '">' + window.EcoConnex.escapeHtml(p.stock) + "</span></div>" +
        '<div class="product-body">' +
          '<h3 class="product-name">' + window.EcoConnex.escapeHtml(p.name) + "</h3>" +
          '<p class="product-desc">' + window.EcoConnex.escapeHtml(p.description) + "</p>" +
          '<span class="product-compat">' + window.EcoConnex.escapeHtml(p.categoryLabel || p.category) + " · " + window.EcoConnex.escapeHtml(p.sku) + "</span>" +
          priceBlock +
          '<div class="product-actions">' +
            actionBtn +
            '<button class="btn-wa-product" onclick="waEnquiry(\'' + p.name.replace(/'/g, "\\'") + '\')"><i class="ti ti-brand-whatsapp"></i></button>' +
          "</div>" +
        "</div>" +
      "</article>"
    );
  }

  /* ---------- Category pills ---------- */

  function renderPills() {
    const groups = window.EcoConnex.CATEGORY_GROUPS;
    pillTrack.innerHTML = groups.map(function (g) {
      const count = g.id === "all"
        ? allProducts.length
        : allProducts.filter(function (p) { return window.EcoConnex.getGroupIdForCategory(p.category) === g.id; }).length;
      const active = activeFilters.categoryGroup === g.id ? " active" : "";
      return (
        '<button class="category-pill' + active + '" data-group="' + g.id + '" role="tab" aria-selected="' + (active ? "true" : "false") + '">' +
          '<i class="ti ' + g.icon + '"></i><span>' + g.label + "</span>" +
          '<span class="cat-count">(' + count + ")</span>" +
        "</button>"
      );
    }).join("");

    pillTrack.querySelectorAll(".category-pill").forEach(function (btn) {
      btn.addEventListener("click", function () {
        setActiveFilter("categoryGroup", btn.getAttribute("data-group"));
      });
    });
  }

  /* ---------- Grid rendering with 200ms fade ---------- */

  function renderGrid() {
    const results = window.EcoConnex.applyFilters(allProducts, activeFilters);

    grid.classList.remove("filtered-in");
    grid.classList.add("filtering");

    setTimeout(function () {
      if (!results.length) {
        grid.innerHTML = "";
        emptyState.classList.add("show");
      } else {
        emptyState.classList.remove("show");
        grid.innerHTML = results.map(cardHtml).join("");
      }
      grid.classList.remove("filtering");
      grid.classList.add("filtered-in");
    }, 200);
  }

  /* ---------- Public setter (future filters call this too) ---------- */

  function setActiveFilter(key, value) {
    activeFilters[key] = value;
    // Reset to "all" semantics for categoryGroup
    if (key === "categoryGroup" && value === "all") activeFilters.categoryGroup = "all";
    renderPills();
    renderGrid();
  }

  // Expose for future filter UIs (Brand / Price / Voltage / Vehicle Model, etc.)
  window.EcoConnex.setActiveFilter = setActiveFilter;

  // Hook: header search box (search-widget.js) calls this on every keystroke.
  window.EcoConnex.onHeaderSearchChange = function (query) {
    activeFilters.search = query || "";
    renderGrid();
  };

  window.EcoConnex.loadProducts().then(function (products) {
    allProducts = products;
    renderPills();
    renderGrid();
  });
})();
