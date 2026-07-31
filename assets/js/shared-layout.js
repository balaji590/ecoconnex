/* ============================================================
   Eco Connex — Shared Layout Loader
   Loads the ONE shared header.html and footer.html into every
   page's #site-header / #site-footer placeholders, then wires
   up the behaviours that depend on those elements existing
   (hamburger menu, scroll shadow, live search, cart badge).

   To change the header or footer for the ENTIRE site, edit
   header.html / footer.html / header.css / footer.css only —
   no page needs to be touched individually.
   ============================================================ */
(function () {
  "use strict";

  const headerMount = document.getElementById("site-header");
  const footerMount = document.getElementById("site-footer");

  function wireHamburger() {
    const hamburger = document.getElementById("hamburger");
    const mobileMenu = document.getElementById("mobileMenu");
    const navbarEl = document.getElementById("navbar");
    if (!hamburger || !mobileMenu) return;
    let scrollLockY = 0;

    window.openMobileMenu = function () {
      scrollLockY = window.scrollY || window.pageYOffset;
      if (navbarEl) {
        const navH = navbarEl.getBoundingClientRect().height;
        mobileMenu.style.paddingTop = navH + 20 + "px";
      }
      document.body.style.top = -scrollLockY + "px";
      document.body.classList.add("menu-open");
      mobileMenu.classList.add("open");
    };
    window.closeMobileMenu = function () {
      mobileMenu.classList.remove("open");
      document.body.classList.remove("menu-open");
      document.body.style.top = "";
      window.scrollTo(0, scrollLockY);
    };
    hamburger.addEventListener("click", function () {
      if (mobileMenu.classList.contains("open")) window.closeMobileMenu();
      else window.openMobileMenu();
    });
    window.addEventListener("resize", function () {
      if (mobileMenu.classList.contains("open") && navbarEl) {
        mobileMenu.style.paddingTop = navbarEl.getBoundingClientRect().height + 20 + "px";
      }
    });
  }

  function wireScrollShadow() {
    const navbar = document.getElementById("navbar");
    if (!navbar) return;
    window.addEventListener(
      "scroll",
      function () {
        navbar.classList.toggle("scrolled", window.scrollY > 50);
      },
      { passive: true }
    );
  }

  function syncHeaderHeight() {
    const navbar = document.getElementById("navbar");
    if (!navbar) return;
    const h = navbar.getBoundingClientRect().height;
    if (h > 0) {
      document.documentElement.style.setProperty("--header-h", h + "px");
    }
  }

  function fetchPartial(url) {
    return fetch(url, { cache: "no-cache" }).then(function (res) {
      if (!res.ok) throw new Error("Failed to load " + url);
      return res.text();
    });
  }

  const tasks = [];

  if (headerMount) {
    tasks.push(
      fetchPartial("components/header.html")
        .then(function (html) {
          headerMount.innerHTML = html;
          wireHamburger();
          wireScrollShadow();
          syncHeaderHeight();
          window.addEventListener("resize", syncHeaderHeight);
          if (typeof window.EcoConnex !== "undefined" && typeof window.EcoConnex.initSearchWidget === "function") {
            window.EcoConnex.initSearchWidget();
          }
          if (typeof window.updateCartUI === "function") {
            window.updateCartUI();
          }
        })
        .catch(function (err) {
          console.error("EcoConnex shared header failed to load:", err);
        })
    );
  }

  if (footerMount) {
    tasks.push(
      fetchPartial("components/footer.html")
        .then(function (html) {
          footerMount.innerHTML = html;
        })
        .catch(function (err) {
          console.error("EcoConnex shared footer failed to load:", err);
        })
    );
  }
})();
