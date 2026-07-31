/* ============================================================
   Eco Connex — Blog data module.
   Mirrors products-data.js: one shared loader, reused by
   blog.html (listing) and blog-post.html (single post).
   ============================================================ */
window.EcoConnex = window.EcoConnex || {};

(function (ns) {
  "use strict";

  let cachedPromise = null;

  function loadBlogPosts() {
    if (cachedPromise) return cachedPromise;
    cachedPromise = fetch("/data/blog-posts.json")
      .then(function (res) {
        if (!res.ok) throw new Error("Failed to load blog posts");
        return res.json();
      })
      .catch(function (err) {
        console.error("EcoConnex: blog posts failed to load", err);
        return [];
      });
    return cachedPromise;
  }

  function getPostBySlug(posts, slug) {
    return posts.find(function (p) { return p.slug === slug; }) || null;
  }

  function getRelatedPosts(posts, current, limit) {
    limit = limit || 3;
    return posts
      .filter(function (p) { return p.id !== current.id; })
      .slice(0, limit);
  }

  function formatDate(isoDate) {
    try {
      const d = new Date(isoDate + "T00:00:00");
      return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
    } catch (e) {
      return isoDate;
    }
  }

  function renderContentHtml(content, escapeHtml) {
    return content.map(function (block) {
      const text = escapeHtml(block.text);
      if (block.type === "h2") return "<h2>" + text + "</h2>";
      if (block.type === "h3") return "<h3>" + text + "</h3>";
      return "<p>" + text + "</p>";
    }).join("");
  }

  ns.loadBlogPosts = loadBlogPosts;
  ns.getPostBySlug = getPostBySlug;
  ns.getRelatedPosts = getRelatedPosts;
  ns.formatBlogDate = formatDate;
  ns.renderBlogContentHtml = renderContentHtml;
})(window.EcoConnex);
