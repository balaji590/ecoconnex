/* ============================================================
   Eco Connex — Premium Header Search Widget
   Live search, debounce, keyboard nav, recent + popular searches.
   Reads product data from the shared EcoConnex.loadProducts()
   module (products-data.js) — no product data lives in this file.
   ============================================================ */
(function () {
  "use strict";

  const DEBOUNCE_MS = 250;
  const MAX_RESULTS = 8;

  const input = document.getElementById("searchInput");
  const clearBtn = document.getElementById("searchClearBtn");
  const dropdown = document.getElementById("searchDropdown");
  if (!input || !dropdown) return; // widget not present on this page

  let allProducts = [];
  let currentItems = []; // items currently rendered & keyboard-navigable
  let activeIndex = -1;
  let debounceTimer = null;

  // Kick off product loading in the background immediately.
  window.EcoConnex.loadProducts().then(function (products) {
    allProducts = products;
  });

  function debounce(fn, ms) {
    return function () {
      const args = arguments;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function () { fn.apply(null, args); }, ms);
    };
  }

  function openDropdown() {
    dropdown.classList.add("open");
    input.setAttribute("aria-expanded", "true");
  }

  function closeDropdown() {
    dropdown.classList.remove("open");
    input.setAttribute("aria-expanded", "false");
    activeIndex = -1;
  }

  function stockClass(stockLabel) {
    const s = (stockLabel || "").toLowerCase();
    if (s.indexOf("low") !== -1) return "low";
    if (s.indexOf("enquire") !== -1) return "enquire";
    return "in-stock";
  }

  function priceLabel(p) {
    return p.priceDisplay || (p.price ? ("₹" + p.price) : "Call for price");
  }

  /* ---------- Rendering ---------- */

  function renderIdlePanel() {
    const recent = window.EcoConnex.getRecentSearches();
    const popular = window.EcoConnex.POPULAR_SEARCHES;
    let html = "";

    if (recent.length) {
      html += '<div class="sd-section-label">Recent Searches</div>';
      recent.forEach(function (term, i) {
        html += '<div class="sd-recent-item" id="sd-recent-' + i + '" data-term="' + window.EcoConnex.escapeHtml(term) + '" role="option">' +
          '<i class="ti ti-history"></i><span>' + window.EcoConnex.escapeHtml(term) + "</span></div>";
      });
      html += '<div class="sd-divider"></div>';
    }

    html += '<div class="sd-section-label">Popular Searches</div>';
    html += '<div class="sd-tags">';
    popular.forEach(function (term) {
      html += '<div class="sd-tag" data-term="' + window.EcoConnex.escapeHtml(term) + '">' + window.EcoConnex.escapeHtml(term) + "</div>";
    });
    html += "</div>";

    dropdown.innerHTML = html;
    currentItems = Array.prototype.slice.call(dropdown.querySelectorAll(".sd-recent-item"));
    activeIndex = -1;
    openDropdown();

    // Click handlers
    dropdown.querySelectorAll(".sd-recent-item, .sd-tag").forEach(function (el) {
      el.addEventListener("click", function () {
        const term = el.getAttribute("data-term");
        input.value = term;
        runSearch(term);
        input.focus();
      });
    });
  }

  function renderResults(query, results) {
    if (!results.length) {
      dropdown.innerHTML =
        '<div class="sd-empty"><i class="ti ti-search-off"></i><p>No products found</p><small>Try another keyword.</small></div>';
      currentItems = [];
      activeIndex = -1;
      openDropdown();
      return;
    }

    let html = "";
    results.forEach(function (p, i) {
      const sClass = stockClass(p.stock);
      html +=
        '<div class="sd-result" data-id="' + p.id + '" id="sd-item-' + i + '" role="option">' +
          '<div class="sd-result-img">' + (p.image || "🔧") + "</div>" +
          '<div class="sd-result-info">' +
            '<div class="sd-result-name">' + window.EcoConnex.highlightMatch(p.name, query) + "</div>" +
            '<div class="sd-result-meta"><span>' + window.EcoConnex.escapeHtml(p.sku) + '</span><span class="dot"></span><span>' + window.EcoConnex.escapeHtml(p.categoryLabel || p.category) + "</span></div>" +
          "</div>" +
          '<div class="sd-result-right">' +
            '<div class="sd-result-price">' + window.EcoConnex.escapeHtml(priceLabel(p)) + "</div>" +
            '<div class="sd-result-stock ' + sClass + '">' + window.EcoConnex.escapeHtml(p.stock) + "</div>" +
          "</div>" +
        "</div>";
    });
    dropdown.innerHTML = html;
    currentItems = Array.prototype.slice.call(dropdown.querySelectorAll(".sd-result"));
    activeIndex = -1;
    openDropdown();

    currentItems.forEach(function (el) {
      el.addEventListener("click", function () {
        goToProduct(el.getAttribute("data-id"), query);
      });
    });
  }

  function goToProduct(id, query) {
    if (query) window.EcoConnex.addRecentSearch(query);
    window.location.href = "products.html?highlight=" + encodeURIComponent(id);
  }

  /* ---------- Search execution ---------- */

  function runSearch(query) {
    if (!query) {
      renderIdlePanel();
      return;
    }
    window.EcoConnex.loadProducts().then(function (products) {
      allProducts = products;
      const results = window.EcoConnex.searchProducts(products, query, MAX_RESULTS);
      renderResults(query, results);
    });
  }

  const debouncedSearch = debounce(function () {
    const q = input.value.trim();
    clearBtn.style.display = q ? "block" : "none";
    runSearch(q);
  }, DEBOUNCE_MS);

  /* ---------- Event wiring ---------- */

  input.addEventListener("input", debouncedSearch);

  input.addEventListener("focus", function () {
    const q = input.value.trim();
    if (q) runSearch(q); else renderIdlePanel();
  });

  clearBtn.addEventListener("click", function () {
    input.value = "";
    clearBtn.style.display = "none";
    renderIdlePanel();
    input.focus();
  });

  document.addEventListener("click", function (e) {
    if (!e.target.closest("#navSearch")) closeDropdown();
  });

  input.addEventListener("keydown", function (e) {
    if (!dropdown.classList.contains("open") || !currentItems.length) {
      if (e.key === "Escape") { closeDropdown(); input.blur(); }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      activeIndex = Math.min(activeIndex + 1, currentItems.length - 1);
      updateActive();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      activeIndex = Math.max(activeIndex - 1, 0);
      updateActive();
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && currentItems[activeIndex]) {
        const el = currentItems[activeIndex];
        if (el.classList.contains("sd-result")) {
          goToProduct(el.getAttribute("data-id"), input.value.trim());
        } else if (el.classList.contains("sd-recent-item")) {
          const term = el.getAttribute("data-term");
          input.value = term;
          runSearch(term);
        }
      } else if (input.value.trim()) {
        window.EcoConnex.addRecentSearch(input.value.trim());
      }
    } else if (e.key === "Escape") {
      closeDropdown();
      input.blur();
    }
  });

  function updateActive() {
    currentItems.forEach(function (el, i) {
      if (i === activeIndex) {
        el.classList.add("active");
        el.scrollIntoView({ block: "nearest" });
        input.setAttribute("aria-activedescendant", el.id || "");
      } else {
        el.classList.remove("active");
      }
    });
  }
})();
