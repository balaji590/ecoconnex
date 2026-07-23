/* ============================================================
   Eco Connex — Shared Product Data Module
   Single source of truth for ALL product data on the site.
   Used by: index.html (search), products.html (catalog listing),
   and any future module (Product Details, Wishlist, Cart,
   WhatsApp Checkout, Admin Panel, Inventory, Database migration).

   To add a new product: add one object to products.json.
   No other code needs to change.
   ============================================================ */
window.EcoConnex = window.EcoConnex || {};

(function (ns) {
  "use strict";

  let _cache = null;
  let _loadingPromise = null;

  /**
   * Loads the product catalog from products.json (cached after first call).
   * @returns {Promise<Array>} array of product objects
   */
  function loadProducts() {
    if (_cache) return Promise.resolve(_cache);
    if (_loadingPromise) return _loadingPromise;
    _loadingPromise = fetch("data/products.json", { cache: "no-cache" })
      .then(function (res) {
        if (!res.ok) throw new Error("Failed to load products.json");
        return res.json();
      })
      .then(function (data) {
        _cache = data;
        return _cache;
      })
      .catch(function (err) {
        console.error("EcoConnex.loadProducts failed:", err);
        _cache = [];
        return _cache;
      });
    return _loadingPromise;
  }

  /**
   * Returns a single product by id.
   */
  function getProductById(products, id) {
    id = Number(id);
    return products.find(function (p) { return p.id === id; }) || null;
  }

  /**
   * Filters products by category (or 'all').
   */
  function getByCategory(products, category) {
    if (!category || category === "all") return products.slice();
    return products.filter(function (p) { return p.category === category; });
  }

  /**
   * Full-text search across name, sku, category, categoryLabel, brand, keywords.
   * Returns matches sorted by relevance (name-start match first).
   */
  function searchProducts(products, query, limit) {
    const q = (query || "").trim().toLowerCase();
    if (!q) return [];
    const scored = [];
    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      const name = (p.name || "").toLowerCase();
      const sku = (p.sku || "").toLowerCase();
      const cat = (p.category || "").toLowerCase();
      const catLabel = (p.categoryLabel || "").toLowerCase();
      const brand = (p.brand || "").toLowerCase();
      const kw = (p.keywords || []).join(" ").toLowerCase();

      let score = -1;
      if (name.startsWith(q)) score = 100;
      else if (name.includes(q)) score = 80;
      else if (sku.includes(q)) score = 70;
      else if (kw.split(" ").indexOf(q) !== -1) score = 65;
      else if (catLabel.includes(q) || cat.includes(q)) score = 50;
      else if (brand.includes(q)) score = 40;
      else if (kw.includes(q)) score = 30;

      if (score > -1) scored.push({ p: p, score: score });
    }
    scored.sort(function (a, b) { return b.score - a.score; });
    const results = scored.map(function (s) { return s.p; });
    return typeof limit === "number" ? results.slice(0, limit) : results;
  }

  /**
   * Highlights the matched substring inside text, returns HTML string.
   */
  function highlightMatch(text, query) {
    if (!query) return escapeHtml(text);
    const q = query.trim();
    if (!q) return escapeHtml(text);
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return escapeHtml(text);
    const before = escapeHtml(text.slice(0, idx));
    const match = escapeHtml(text.slice(idx, idx + q.length));
    const after = escapeHtml(text.slice(idx + q.length));
    return before + "<mark>" + match + "</mark>" + after;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /**
   * Truncates long text to maxLen characters at a word boundary, for
   * compact card display (product cards use the client's short
   * description when available; this is the fallback for older
   * records that only have the long description).
   */
  function shortText(str, maxLen) {
    str = String(str || "");
    if (str.length <= maxLen) return str;
    return str.slice(0, maxLen).replace(/\s+\S*$/, "") + "…";
  }

  /* ---- Recent searches (localStorage) ---- */
  const RECENT_KEY = "ecoconnex_recent_searches";
  const RECENT_MAX = 5;

  function getRecentSearches() {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  function addRecentSearch(term) {
    term = (term || "").trim();
    if (!term) return;
    try {
      let list = getRecentSearches().filter(function (t) {
        return t.toLowerCase() !== term.toLowerCase();
      });
      list.unshift(term);
      list = list.slice(0, RECENT_MAX);
      localStorage.setItem(RECENT_KEY, JSON.stringify(list));
    } catch (e) { /* localStorage unavailable — fail silently */ }
  }

  const POPULAR_SEARCHES = ["Battery", "Charger", "Motor", "Controller", "Brake Pad"];

  /* ============================================================
     CATEGORY GROUPS — maps the granular product categories
     (throttle, disc, wiring, etc.) into the simplified nav
     taxonomy shown in the homepage category bar.
     To add/rename a homepage category: edit this list only.
     ============================================================ */
  const CATEGORY_GROUPS = [
    { id: "all", label: "All Products", icon: "ti-apps", categories: null },
    { id: "batteries", label: "Batteries", icon: "ti-battery-4", categories: ["battery", "batteries"] },
    { id: "chargers", label: "Chargers", icon: "ti-plug", categories: ["charger"] },
    { id: "motors", label: "Motors", icon: "ti-engine", categories: ["motor"] },
    { id: "controllers", label: "Controllers", icon: "ti-cpu", categories: ["controller", "converter", "dc-converter", "mcb"] },
    { id: "brake-parts", label: "Brake Parts", icon: "ti-disc", categories: ["brakes", "brake", "disc", "brake-shoe", "drum-plate", "lever"] },
    { id: "accessories", label: "Accessories", icon: "ti-adjustments", categories: ["mirrors", "mirror", "lights", "led", "switches", "switch", "sensor", "locks", "lock", "throttle", "fork-set", "accessories", "other"] },
    { id: "cables", label: "Cables", icon: "ti-cable", categories: ["wiring", "connector", "electrical"] },
    { id: "body-parts", label: "Body Parts", icon: "ti-car", categories: ["body", "bearing"] }
  ];

  const _catToGroup = {};
  CATEGORY_GROUPS.forEach(function (g) {
    if (g.categories) g.categories.forEach(function (c) { _catToGroup[c] = g.id; });
  });

  function getGroupIdForCategory(category) {
    return _catToGroup[category] || "accessories";
  }

  /* ============================================================
     GENERIC FILTER PIPELINE — future-ready architecture.
     Register a new filter once with registerFilter(name, fn);
     it is then automatically combined with every other active
     filter by applyFilters(). No existing filter code needs to
     change when a new filter (Brand, Price, Voltage, Vehicle
     Model, ...) is added.
     ============================================================ */
  const _filterRegistry = {};

  function registerFilter(name, predicateFn) {
    _filterRegistry[name] = predicateFn;
  }

  function applyFilters(products, activeFilters) {
    const keys = Object.keys(activeFilters || {}).filter(function (k) {
      const v = activeFilters[k];
      return v !== null && v !== undefined && v !== "" && v !== "all";
    });
    if (!keys.length) return products.slice();
    return products.filter(function (p) {
      return keys.every(function (k) {
        const fn = _filterRegistry[k];
        return fn ? fn(p, activeFilters[k]) : true;
      });
    });
  }

  // Built-in filters
  registerFilter("categoryGroup", function (p, groupId) {
    return getGroupIdForCategory(p.category) === groupId;
  });
  registerFilter("search", function (p, query) {
    const q = (query || "").toLowerCase().trim();
    if (!q) return true;
    return (
      p.name.toLowerCase().indexOf(q) !== -1 ||
      p.sku.toLowerCase().indexOf(q) !== -1 ||
      p.category.toLowerCase().indexOf(q) !== -1 ||
      (p.categoryLabel || "").toLowerCase().indexOf(q) !== -1 ||
      p.brand.toLowerCase().indexOf(q) !== -1 ||
      (p.keywords || []).some(function (k) { return k.indexOf(q) !== -1; })
    );
  });
  // Example future filters (inactive until UI sets them):
  // registerFilter('brand', function(p, brand){ return p.brand === brand; });
  // registerFilter('maxPrice', function(p, max){ return p.price != null && p.price <= max; });
  // registerFilter('voltage', function(p, v){ return (p.keywords||[]).indexOf(v) !== -1; });

  /* ---- Recently viewed products (localStorage) ---- */
  const VIEWED_KEY = "ecoconnex_recently_viewed";
  const VIEWED_MAX = 6;

  function getRecentlyViewed() {
    try {
      const raw = localStorage.getItem(VIEWED_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  function addRecentlyViewed(id) {
    id = Number(id);
    try {
      let list = getRecentlyViewed().filter(function (x) { return x !== id; });
      list.unshift(id);
      list = list.slice(0, VIEWED_MAX);
      localStorage.setItem(VIEWED_KEY, JSON.stringify(list));
    } catch (e) { /* ignore */ }
  }

  /**
   * Returns true if a product has a genuine active offer
   * (numeric MRP strictly greater than the selling price).
   */
  const CURRENCY_SYMBOLS = { INR: "₹", USD: "$", EUR: "€", GBP: "£" };

  /**
   * Returns the display symbol for a product's currency, defaulting
   * to ₹ (INR) for backward compatibility with older product records
   * that don't have a "currency" field yet.
   */
  function getCurrencySymbol(currency) {
    return CURRENCY_SYMBOLS[currency || "INR"] || "₹";
  }

  /**
   * True when a product's selling price should actually be displayed.
   * Missing, zero, negative or non-numeric price = not visible, and the
   * UI should fall back to "Price on Request" instead of showing ₹0.
   */
  function isPriceVisible(p) {
    return typeof p.price === "number" && isFinite(p.price) && p.price > 0;
  }

  /**
   * A genuine offer requires a visible selling price AND a numeric MRP
   * strictly greater than it. Missing/zero/equal MRP simply means no
   * offer — this stays safe even for older product records that were
   * created before "mrp"/"discount"/"currency" existed.
   */
  function hasOffer(p) {
    return isPriceVisible(p) && typeof p.mrp === "number" && p.mrp > p.price;
  }

  /**
   * Returns { savings, percent } for a product with an active offer.
   * Prefers the product's own stored "discount" field (so a future
   * client Excel import can set an exact intended percentage), and
   * falls back to computing it from mrp/price when that field is
   * missing, zero, or inconsistent with the actual prices.
   * Returns null if there is no genuine offer.
   */
  function getOffer(p) {
    if (!hasOffer(p)) return null;
    const savings = p.mrp - p.price;
    const computedPercent = Math.round((savings / p.mrp) * 100);
    const storedPercent = typeof p.discount === "number" && p.discount > 0 ? Math.round(p.discount) : null;
    return { savings: savings, percent: storedPercent || computedPercent };
  }

  /**
   * Renders a consistent MRP / Selling Price / discount-badge block
   * used by Product Listing, PDP, Cart and WhatsApp Checkout.
   * opts.sizeClass lets a page opt into a larger/smaller variant
   * via CSS (e.g. "price-lg" on the PDP) without duplicating markup.
   */
  function renderPriceHtml(p, opts) {
    opts = opts || {};
    const sizeClass = opts.sizeClass || "";
    const sym = getCurrencySymbol(p.currency);
    if (!isPriceVisible(p)) {
      return '<div class="price-block ' + sizeClass + '"><span class="price-call">Price on Request</span></div>';
    }
    const offer = getOffer(p);
    let html = '<div class="price-block ' + sizeClass + '">';
    html += '<span class="price-selling">' + sym + p.price.toLocaleString("en-IN") + "</span>";
    if (offer) {
      html += '<span class="price-mrp">' + sym + p.mrp.toLocaleString("en-IN") + "</span>";
      html += '<span class="price-off-badge">' + offer.percent + "% OFF</span>";
    }
    html += "</div>";
    if (offer && opts.hideSavingsLine !== true) {
      html += '<div class="price-savings"><i class="ti ti-discount-2"></i> You save ' + sym + offer.savings.toLocaleString("en-IN") + "</div>";
    }
    return html;
  }

  /**
   * Renders a product's image with a graceful fallback: tries the real
   * photo (from the client's product Excel) at assets/images/products/,
   * and falls back to a category emoji icon automatically via onerror
   * if that file hasn't been uploaded yet. Older product records with
   * no "image" filename (pre-photo catalog) just show the icon directly.
   */
  function renderProductImageHtml(p, opts) {
    opts = opts || {};
    const imgClass = opts.imgClass || "";
    const w = opts.width || 300;
    const h = opts.height || 300;
    const icon = p.icon || p.image /* legacy: image used to BE the emoji */ || "🔧";
    const looksLikeFile = typeof p.image === "string" && /\.(webp|jpg|jpeg|png|gif|avif)$/i.test(p.image);
    if (!looksLikeFile) {
      return '<span class="product-icon-fallback ' + imgClass + '">' + icon + "</span>";
    }
    const src = "assets/images/products/" + encodeURIComponent(p.image);
    return (
      '<img src="' + src + '" alt="' + escapeHtml(p.name) + '" class="product-photo ' + imgClass + '" ' +
      'width="' + w + '" height="' + h + '" loading="lazy" decoding="async" ' +
      'onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\';"/>' +
      '<span class="product-icon-fallback ' + imgClass + '" style="display:none;">' + icon + "</span>"
    );
  }

  /**
   * Single source of truth for stock-badge styling across every page.
   * Replaces four near-identical copies that only recognised "low" and
   * "enquire" — now also recognises "out of stock" from real inventory
   * data so it renders as a distinct, non-purchasable state.
   */
  function getStockClass(stock) {
    const s = (stock || "").toLowerCase();
    if (s.indexOf("out") !== -1) return "out-of-stock";
    if (s.indexOf("low") !== -1) return "low";
    if (s.indexOf("enquire") !== -1) return "enquire";
    return "in-stock";
  }

  function isOutOfStock(p) {
    return getStockClass(p.stock) === "out-of-stock";
  }

  function getRelatedProducts(products, product, limit) {
    limit = limit || 4;
    const groupId = getGroupIdForCategory(product.category);
    const sameGroup = products.filter(function (p) {
      return p.id !== product.id && getGroupIdForCategory(p.category) === groupId;
    });
    if (sameGroup.length >= limit) return sameGroup.slice(0, limit);
    const fillers = products.filter(function (p) {
      return p.id !== product.id && sameGroup.indexOf(p) === -1;
    });
    return sameGroup.concat(fillers).slice(0, limit);
  }

  ns.loadProducts = loadProducts;
  ns.getProductById = getProductById;
  ns.getByCategory = getByCategory;
  ns.searchProducts = searchProducts;
  ns.highlightMatch = highlightMatch;
  ns.escapeHtml = escapeHtml;
  ns.shortText = shortText;
  ns.getRecentSearches = getRecentSearches;
  ns.addRecentSearch = addRecentSearch;
  ns.POPULAR_SEARCHES = POPULAR_SEARCHES;
  ns.CATEGORY_GROUPS = CATEGORY_GROUPS;
  ns.getGroupIdForCategory = getGroupIdForCategory;
  ns.registerFilter = registerFilter;
  ns.applyFilters = applyFilters;
  ns.getRecentlyViewed = getRecentlyViewed;
  ns.addRecentlyViewed = addRecentlyViewed;
  ns.getRelatedProducts = getRelatedProducts;
  ns.hasOffer = hasOffer;
  ns.getOffer = getOffer;
  ns.renderPriceHtml = renderPriceHtml;
  ns.isPriceVisible = isPriceVisible;
  ns.getCurrencySymbol = getCurrencySymbol;
  ns.renderProductImageHtml = renderProductImageHtml;
  ns.getStockClass = getStockClass;
  ns.isOutOfStock = isOutOfStock;
})(window.EcoConnex);
