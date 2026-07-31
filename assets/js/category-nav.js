/* ============================================================
   Eco Connex — Enterprise Category Navigation.
   Renders a sticky category bar below the header (desktop only)
   and a "Browse Categories" accordion inside the mobile hamburger
   menu. Categories are NEVER hardcoded — generated live from
   products-data.js (which reads data/products.json / the CMS),
   so adding/renaming/removing a category via /admin updates the
   nav automatically with zero code changes.

   Architecture note (future scalability): each nav entry carries
   a plain {key, label, icon, count, href} shape. Dealer-only,
   wholesale, brand-wise, or "Shop by Vehicle" entries can be
   appended to the same array later without restructuring this
   module — buildNavEntries() is the single seam to extend.
   ============================================================ */
window.EcoConnex = window.EcoConnex || {};

(function (ns) {
  "use strict";

  function getActiveCategory() {
    const params = new URLSearchParams(window.location.search);
    return params.get("category") || "";
  }

  function isOnProductsPage() {
    return /products\.html$/.test(window.location.pathname) || /\/products\.html/.test(window.location.pathname);
  }

  /**
   * Builds the ordered nav entry list: Home, All Products, then real
   * categories by product count (business-priority, not alphabetical),
   * then Contact. This is the one seam to extend for future entry
   * types (dealer, wholesale, brand-wise, seasonal, etc.).
   */
  function buildNavEntries(categories) {
    const entries = [
      { key: "", label: "Home", icon: "ti-home", href: "/index.html", isStatic: true },
      { key: "all", label: "All Products", icon: "ti-layout-grid", href: "/products.html", isStatic: true }
    ];
    categories.forEach(function (c) {
      entries.push({
        key: c.key,
        label: c.label,
        icon: ns.getCategoryIcon(c.key),
        count: c.count,
        href: "/products/category/" + encodeURIComponent(c.key) + "/",
        isStatic: false
      });
    });
    entries.push({ key: "contact", label: "Contact", icon: "ti-headset", href: "/contact.html", isStatic: true });
    return entries;
  }

  function entryHtml(entry, activeKey) {
    const isActive = entry.key === activeKey;
    const countHtml = (typeof entry.count === "number" && entry.count > 0) ? '<span class="cn-count">(' + entry.count + ")</span>" : "";
    return (
      '<a href="' + entry.href + '" class="cn-item' + (isActive ? " active" : "") + '" data-cat-key="' + ns.escapeHtml(entry.key) + '">' +
        '<i class="ti ' + entry.icon + '" aria-hidden="true"></i>' +
        '<span class="cn-label">' + ns.escapeHtml(entry.label) + "</span>" +
        countHtml +
      "</a>"
    );
  }

  function getCurrentPageActiveKey() {
    const catMatch = window.location.pathname.match(/\/products\/category\/([^/]+)\/?/);
    if (catMatch) return decodeURIComponent(catMatch[1]);
    if (isOnProductsPage()) return getActiveCategory() || "all";
    const pageName = window.location.pathname.replace(/^.*\//, "");
    if (pageName === "" || pageName === "index.html") return "";
    if (pageName === "contact.html") return "contact";
    return "__none__";
  }

  function renderDesktopBar(entries) {
    const activeKey = getCurrentPageActiveKey();
    const bar = document.createElement("nav");
    bar.className = "cn-bar";
    bar.setAttribute("aria-label", "Product categories");
    bar.innerHTML = '<div class="cn-bar-inner">' + entries.map(function (e) { return entryHtml(e, activeKey); }).join("") + "</div>";
    const headerMount = document.getElementById("site-header");
    if (headerMount && headerMount.parentNode) {
      headerMount.parentNode.insertBefore(bar, headerMount.nextSibling);
    }
  }

  function renderMobileAccordion(entries) {
    const mobileMenu = document.getElementById("mobileMenu");
    if (!mobileMenu) return;

    const realCategories = entries.filter(function (e) { return !e.isStatic; });
    if (!realCategories.length) return;

    const wrap = document.createElement("div");
    wrap.className = "cn-mobile-wrap";
    wrap.innerHTML =
      '<button type="button" class="cn-mobile-toggle" id="cnMobileToggle" aria-expanded="false" aria-controls="cnMobileList">' +
        '<span><i class="ti ti-category" aria-hidden="true"></i> Browse Categories</span>' +
        '<i class="ti ti-chevron-down cn-mobile-arrow" aria-hidden="true"></i>' +
      "</button>" +
      '<div class="cn-mobile-list" id="cnMobileList">' +
        realCategories.map(function (e) {
          return (
            '<a href="' + e.href + '" class="cn-mobile-item" onclick="closeMobileMenu()">' +
              '<i class="ti ' + e.icon + '" aria-hidden="true"></i>' +
              '<span class="cn-label">' + ns.escapeHtml(e.label) + "</span>" +
              (typeof e.count === "number" ? '<span class="cn-count">(' + e.count + ")</span>" : "") +
            "</a>"
          );
        }).join("") +
      "</div>";

    // Insert right after the first static link (Products) so it reads
    // naturally in the existing mobile menu flow.
    const firstLink = mobileMenu.querySelector("a");
    if (firstLink && firstLink.nextSibling) {
      mobileMenu.insertBefore(wrap, firstLink.nextSibling);
    } else {
      mobileMenu.appendChild(wrap);
    }

    const toggle = document.getElementById("cnMobileToggle");
    const list = document.getElementById("cnMobileList");
    toggle.addEventListener("click", function () {
      const isOpen = list.classList.toggle("open");
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      toggle.classList.toggle("open", isOpen);
    });
  }

  function init() {
    ns.loadProducts().then(function (products) {
      const categories = ns.getCategoriesWithCounts(products);
      const entries = buildNavEntries(categories);
      renderDesktopBar(entries);
      renderMobileAccordion(entries);
    });
  }

  // Wait for the shared header (and mobile menu markup inside it) to be
  // in the DOM before building the nav around it.
  function waitForHeaderThenInit() {
    if (document.getElementById("mobileMenu")) { init(); return; }
    const observer = new MutationObserver(function () {
      if (document.getElementById("mobileMenu")) {
        observer.disconnect();
        init();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", waitForHeaderThenInit);
  } else {
    waitForHeaderThenInit();
  }
})(window.EcoConnex);
