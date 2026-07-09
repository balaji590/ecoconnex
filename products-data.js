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
    _loadingPromise = fetch("products.json", { cache: "no-cache" })
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

  ns.loadProducts = loadProducts;
  ns.getProductById = getProductById;
  ns.getByCategory = getByCategory;
  ns.searchProducts = searchProducts;
  ns.highlightMatch = highlightMatch;
  ns.escapeHtml = escapeHtml;
  ns.getRecentSearches = getRecentSearches;
  ns.addRecentSearch = addRecentSearch;
  ns.POPULAR_SEARCHES = POPULAR_SEARCHES;
})(window.EcoConnex);
