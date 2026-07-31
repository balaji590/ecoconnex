#!/usr/bin/env node
/* ============================================================
   Eco Connex — Category Landing Page Generator.

   Reads data/products.json, finds every real category, and
   writes a physical /products/category/<slug>/index.html for
   each one. Re-run any time products.json changes (a GitHub
   Action does this automatically on every push to main — see
   .github/workflows/generate-category-pages.yml) so categories
   added/renamed/removed via the CMS are always in sync with
   zero manual code changes.

   Every generated page reuses the EXACT SAME CSS/JS as
   products.html (products.css, products-listing.js, etc.) —
   only a tiny inline snippet (window.EC_CATEGORY_LOCK = "...")
   differs, which tells products-listing.js which category to
   lock the listing to. No HTML/CSS/JS is duplicated by hand;
   this script is the single source of the per-category shell.

   Usage: node scripts/generate-category-pages.js
   ============================================================ */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const PRODUCTS_JSON = path.join(ROOT, "data", "products.json");
const OUTPUT_BASE = path.join(ROOT, "products", "category");
const SITE_URL = "https://ecoconnex.in";

function loadCategories() {
  const raw = JSON.parse(fs.readFileSync(PRODUCTS_JSON, "utf-8"));
  const products = raw.products || raw;
  const counts = {};
  products.forEach(function (p) {
    if (!counts[p.category]) counts[p.category] = { key: p.category, label: p.categoryLabel || p.category, count: 0 };
    counts[p.category].count++;
  });
  return Object.keys(counts).map(function (k) { return counts[k]; }).sort(function (a, b) { return b.count - a.count; });
}

function escapeHtml(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function pageTemplate(cat) {
  const label = cat.label;
  const slug = cat.key;
  const url = SITE_URL + "/products/category/" + slug + "/";
  const title = label + " – Genuine EV Spare Parts (" + cat.count + "+ Products) | Eco Connex";
  const description = "Shop genuine " + label + " for your EV at Eco Connex — " + cat.count + "+ products, COD available, fast Tamil Nadu delivery, GST billing.";

  const breadcrumbSchema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": SITE_URL + "/" },
      { "@type": "ListItem", "position": 2, "name": "Products", "item": SITE_URL + "/products.html" },
      { "@type": "ListItem", "position": 3, "name": label, "item": url }
    ]
  });

  const collectionSchema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": label + " – Eco Connex",
    "description": description,
    "url": url
  });

  return "<!DOCTYPE html>\n" +
'<html lang="en">\n' +
"<head>\n" +
'  <meta charset="UTF-8"/>\n' +
'  <meta name="viewport" content="width=device-width,initial-scale=1.0,viewport-fit=cover"/>\n' +
"  <!-- Google tag (gtag.js) -->\n" +
'  <script async src="https://www.googletagmanager.com/gtag/js?id=G-ECH2NE3GTT"></script>\n' +
"  <script>\n" +
"    window.dataLayer = window.dataLayer || [];\n" +
"    function gtag(){dataLayer.push(arguments);}\n" +
"    gtag('js', new Date());\n" +
"    gtag('config', 'G-ECH2NE3GTT');\n" +
"  </script>\n" +
"  <!-- Meta Pixel Code -->\n" +
"  <script>\n" +
"  !function(f,b,e,v,n,t,s)\n" +
"  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?\n" +
"  n.callMethod.apply(n,arguments):n.queue.push(arguments)};\n" +
"  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';\n" +
"  n.queue=[];t=b.createElement(e);t.async=!0;\n" +
"  t.src=v;s=b.getElementsByTagName(e)[0];\n" +
"  s.parentNode.insertBefore(t,s)}(window, document,'script',\n" +
"  'https://connect.facebook.net/en_US/fbevents.js');\n" +
"  fbq('init', '2509241412910841');\n" +
"  fbq('track', 'PageView');\n" +
"  </script>\n" +
'  <noscript><img height="1" width="1" style="display:none"\n' +
'  src="https://www.facebook.com/tr?id=2509241412910841&ev=PageView&noscript=1"\n' +
"  /></noscript>\n" +
"  <!-- End Meta Pixel Code -->\n" +
"  <title>" + escapeHtml(title) + "</title>\n" +
'  <meta name="description" content="' + escapeHtml(description) + '"/>\n' +
'  <meta name="robots" content="index, follow, max-image-preview:large"/>\n' +
'  <meta name="author" content="Eco Connex"/>\n' +
'  <meta name="theme-color" content="#f97316"/>\n' +
'  <link rel="canonical" href="' + url + '"/>\n' +
'  <link rel="manifest" href="/manifest.json"/>\n' +
'  <link rel="icon" type="image/svg+xml" href="/favicon.svg" sizes="any"/>\n' +
'  <link rel="icon" type="image/png" href="/assets/images/logo.png"/>\n' +
'  <link rel="apple-touch-icon" href="/assets/images/logo.png"/>\n' +
"\n" +
'  <meta property="og:type" content="website"/>\n' +
'  <meta property="og:site_name" content="Eco Connex"/>\n' +
'  <meta property="og:locale" content="en_IN"/>\n' +
'  <meta property="og:title" content="' + escapeHtml(label) + ' – Eco Connex"/>\n' +
'  <meta property="og:description" content="' + escapeHtml(description) + '"/>\n' +
'  <meta property="og:url" content="' + url + '"/>\n' +
'  <meta property="og:image" content="' + SITE_URL + '/assets/images/logo.png"/>\n' +
"\n" +
'  <meta name="twitter:card" content="summary_large_image"/>\n' +
'  <meta name="twitter:title" content="' + escapeHtml(label) + ' – Eco Connex"/>\n' +
'  <meta name="twitter:description" content="' + escapeHtml(description) + '"/>\n' +
'  <meta name="twitter:image" content="' + SITE_URL + '/assets/images/logo.png"/>\n' +
"\n" +
'  <script type="application/ld+json">' + breadcrumbSchema + "</script>\n" +
'  <script type="application/ld+json">' + collectionSchema + "</script>\n" +
"\n" +
'  <link rel="preconnect" href="https://fonts.googleapis.com"/>\n' +
'  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>\n' +
'  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>\n' +
'  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css"/>\n' +
'  <link rel="stylesheet" href="/assets/css/header.css"/>\n' +
'  <link rel="stylesheet" href="/assets/css/category-nav.css"/>\n' +
'  <link rel="stylesheet" href="/assets/css/footer.css"/>\n' +
'  <link rel="stylesheet" href="/assets/css/products.css"/>\n' +
'  <link rel="stylesheet" href="/assets/css/quick-view.css"/>\n' +
"</head>\n" +
"<body class=\"category-page\">\n" +
"\n" +
"<!-- SHARED HEADER (loaded from header.html by shared-layout.js) -->\n" +
'<div id="site-header"></div>\n' +
"\n" +
"<main>\n" +
'<div class="breadcrumb" id="categoryBreadcrumb">\n' +
'  <a href="/index.html">Home</a><i class="ti ti-chevron-right"></i>\n' +
'  <a href="/products.html">Products</a><i class="ti ti-chevron-right"></i>\n' +
'  <span class="current">' + escapeHtml(label) + "</span>\n" +
"</div>\n" +
"\n" +
'<div class="hero">\n' +
'  <div class="hero-badge" id="heroBadge"><i class="ti ' + "ph-icon-placeholder" + '"></i> ' + escapeHtml(label) + "</div>\n" +
'  <h1 id="heroTitle">' + escapeHtml(label) + " <span>for Your EV</span></h1>\n" +
'  <p id="heroSubtitle">Browse all ' + escapeHtml(label) + " available for your EV — genuine parts, fast delivery.</p>\n" +
'  <div class="hero-stats">\n' +
'    <div class="hero-stat"><div class="hero-stat-num" id="heroStatCount">' + cat.count + '</div><div class="hero-stat-label" id="heroStatCountLabel">Products</div></div>\n' +
'    <div class="hero-stat"><div class="hero-stat-num">COD</div><div class="hero-stat-label">Available</div></div>\n' +
'    <div class="hero-stat"><div class="hero-stat-num">All India</div><div class="hero-stat-label">Delivery</div></div>\n' +
'    <div class="hero-stat"><div class="hero-stat-num">GST</div><div class="hero-stat-label">Registered</div></div>\n' +
"  </div>\n" +
"</div>\n" +
"\n" +
"\n" +
'<div class="controls">\n' +
'  <div class="filter-toprow" id="filterToprow">\n' +
'    <div class="filter-scroll" id="filterBtns"></div>\n' +
'    <button class="btn-filters-toggle" id="filtersToggle" onclick="toggleFiltersPanel()"><i class="ti ti-adjustments-horizontal"></i> Filters<span class="filter-active-badge" id="filterActiveBadge" style="display:none;"></span></button>\n' +
"  </div>\n" +
'  <div class="filters-panel" id="filtersPanel">\n' +
'    <div class="filters-panel-col">\n' +
'      <div class="filters-panel-label">Brand</div>\n' +
'      <div class="filters-checklist" id="brandFilterList"></div>\n' +
"    </div>\n" +
'    <div class="filters-panel-col">\n' +
'      <div class="filters-panel-label">Availability</div>\n' +
'      <label class="filters-check-item"><input type="checkbox" id="inStockOnly" onchange="filterProducts()"/> In Stock Only</label>\n' +
"    </div>\n" +
'    <div class="filters-panel-col">\n' +
'      <div class="filters-panel-label">Price (₹)</div>\n' +
'      <div class="filters-price-row">\n' +
'        <input type="number" id="priceMin" class="filters-price-input" placeholder="Min" min="0" oninput="filterProducts()"/>\n' +
"        <span>–</span>\n" +
'        <input type="number" id="priceMax" class="filters-price-input" placeholder="Max" min="0" oninput="filterProducts()"/>\n' +
"      </div>\n" +
"    </div>\n" +
'    <div class="filters-panel-col filters-panel-clear">\n' +
'      <button class="btn-clear-filters" onclick="clearAllFilters()"><i class="ti ti-x"></i> Clear All Filters</button>\n' +
"    </div>\n" +
"  </div>\n" +
"</div>\n" +
'<div class="results-count"><span id="resultCount">' + cat.count + '</span> products found</div>\n' +
"\n" +
'<div class="products-wrap">\n' +
'  <div class="products-grid" id="productsGrid"></div>\n' +
'  <div class="no-results" id="noResults">\n' +
'    <i class="ti ti-search-off"></i>\n' +
"    <p>No products found</p>\n" +
"    <small>Try adjusting your search or filters</small>\n" +
'    <button class="btn-clear-filters" style="margin:16px auto 0;display:inline-flex;" onclick="clearAllFilters()"><i class="ti ti-x"></i> Clear All Filters</button>\n' +
"  </div>\n" +
"</div>\n" +
"</main>\n" +
"\n" +
"<!-- SHARED FOOTER (loaded from footer.html by shared-layout.js) -->\n" +
'<div id="site-footer"></div>\n' +
"\n" +
'<div class="cart-overlay" id="cartOverlay" onclick="closeCart()"></div>\n' +
'<div class="cart-sidebar" id="cartSidebar">\n' +
'  <div class="cart-header">\n' +
'    <h3><i class="ti ti-shopping-cart"></i> Your Cart</h3>\n' +
'    <button class="cart-close" onclick="closeCart()" aria-label="Close cart"><i class="ti ti-x"></i></button>\n' +
"  </div>\n" +
'  <div class="cart-items" id="cartItems"></div>\n' +
'  <div class="cart-footer" id="cartFooter" style="display:none;">\n' +
'    <div class="cart-summary-extra" id="cartSummaryExtra" style="display:none;">\n' +
'      <div class="cart-mrp-row"><span>Total MRP</span><strong id="cartMrpTotal">₹0</strong></div>\n' +
'      <div class="cart-savings-row"><span>You Save</span><strong id="cartSavingsTotal">₹0</strong></div>\n' +
"    </div>\n" +
'    <div class="cart-total-row"><span>Total</span><strong id="cartTotal">₹0</strong></div>\n' +
'    <div class="cart-gst-note">Prices exclude GST. Applicable GST added at billing.</div>\n' +
'    <button class="btn-cart-checkout" onclick="EcoConnex.openCheckoutModal()"><i class="ti ti-brand-whatsapp"></i> Checkout via WhatsApp</button>\n' +
"  </div>\n" +
"</div>\n" +
"\n" +
'<script>window.EC_CATEGORY_LOCK = "' + slug.replace(/"/g, '\\"') + '";</script>\n' +
'<script src="/assets/js/products-data.js"></script>\n' +
'<script src="/assets/js/cart.js"></script>\n' +
'<script src="/assets/js/wishlist.js"></script>\n' +
'<script src="/assets/js/category-nav.js"></script>\n' +
'<script src="/assets/js/orders.js"></script>\n' +
'<script src="/assets/js/checkout.js"></script>\n' +
'<script src="/assets/js/quick-view.js"></script>\n' +
'<script src="/assets/js/search-widget.js"></script>\n' +
'<script src="/assets/js/shared-layout.js"></script>\n' +
'<script src="/assets/js/products-listing.js"></script>\n' +
"</body>\n" +
"</html>\n";
}

function updateSitemap(categories) {
  const sitemapPath = path.join(ROOT, "sitemap.xml");
  if (!fs.existsSync(sitemapPath)) return;

  let xml = fs.readFileSync(sitemapPath, "utf-8");
  const today = new Date().toISOString().slice(0, 10);

  // Strip any previously-generated category <url> blocks (marked with a
  // comment) so re-running this script never duplicates entries.
  xml = xml.replace(/\s*<!-- CATEGORY_PAGES_START -->[\s\S]*?<!-- CATEGORY_PAGES_END -->\n?/, "");

  const entries = categories.map(function (cat) {
    return "  <url>\n" +
      "    <loc>" + SITE_URL + "/products/category/" + cat.key + "/</loc>\n" +
      "    <lastmod>" + today + "</lastmod>\n" +
      "    <changefreq>weekly</changefreq>\n" +
      "    <priority>0.8</priority>\n" +
      "  </url>";
  }).join("\n");

  const block = "  <!-- CATEGORY_PAGES_START -->\n" + entries + "\n  <!-- CATEGORY_PAGES_END -->\n";
  xml = xml.replace("</urlset>", block + "</urlset>");
  fs.writeFileSync(sitemapPath, xml, "utf-8");
  console.log("sitemap.xml updated with", categories.length, "category URLs.");
}

function main() {
  const categories = loadCategories();

  // Remove stale category folders (categories renamed/removed in the CMS
  // should not leave orphaned pages behind).
  if (fs.existsSync(OUTPUT_BASE)) {
    const existing = fs.readdirSync(OUTPUT_BASE);
    const validSlugs = new Set(categories.map(function (c) { return c.key; }));
    existing.forEach(function (slug) {
      if (!validSlugs.has(slug)) {
        fs.rmSync(path.join(OUTPUT_BASE, slug), { recursive: true, force: true });
        console.log("Removed stale category page:", slug);
      }
    });
  }

  fs.mkdirSync(OUTPUT_BASE, { recursive: true });

  categories.forEach(function (cat) {
    const dir = path.join(OUTPUT_BASE, cat.key);
    fs.mkdirSync(dir, { recursive: true });
    const html = pageTemplate(cat).replace(
      '<i class="ti ph-icon-placeholder"></i>',
      '<i class="ti ' + require("./category-icon-map")(cat.key) + '"></i>'
    );
    fs.writeFileSync(path.join(dir, "index.html"), html, "utf-8");
    console.log("Generated:", "/products/category/" + cat.key + "/  (" + cat.count + " products)");
  });

  console.log("\nDone —", categories.length, "category pages generated.");
  updateSitemap(categories);
}

main();
