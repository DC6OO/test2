(function () {
  var FALLBACK = [
    { image: "images/monster-cake.png", caption: "Celebration cake", alt: "Custom celebration cake" },
    { image: "images/wedding-pearl-cake.png", caption: "Wedding cake", alt: "Pearl wedding cake" },
    { image: "images/wedding-rose-cake.png", caption: "Floral finish", alt: "Rose wedding cake" },
    { image: "images/cake-slices.png", caption: "Sweet selections", alt: "Cake slices" },
  ];

  function escapeHtml(s) {
    var div = document.createElement("div");
    div.textContent = s == null ? "" : String(s);
    return div.innerHTML;
  }

  function escapeAttr(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;");
  }

  function getItems(root) {
    var items = window.ShopData && window.ShopData.getGallery ? window.ShopData.getGallery() : [];
    var limitAttr = root.getAttribute("data-gallery-limit");
    if (limitAttr) {
      var limit = parseInt(limitAttr, 10);
      if (!isNaN(limit) && limit > 0) items = items.slice(0, limit);
    }
    if (!items.length) {
      items = FALLBACK.slice();
      if (limitAttr) {
        var fallbackLimit = parseInt(limitAttr, 10);
        if (!isNaN(fallbackLimit) && fallbackLimit > 0) items = items.slice(0, fallbackLimit);
      }
    }
    return items;
  }

  function renderOne(root) {
    var container = root.querySelector("[data-gallery-slides]") || root.querySelector("[data-slideshow-slides]");
    if (!container) return;

    var items = getItems(root);
    container.innerHTML = "";
    root.removeAttribute("data-slideshow-ready");

    items.forEach(function (item, i) {
      var caption = item.caption || "Connie's Cake Shop";
      var alt = item.alt || caption;
      var el = document.createElement("div");
      el.className = "slide" + (i === 0 ? " is-active" : "");
      el.setAttribute("data-slide", "");
      el.style.setProperty("--slide-index", String(i));
      el.innerHTML =
        '<div class="slide-bg" style="background-image: url(\'' +
        escapeAttr(item.image) +
        "')\" role=\"img\" aria-label=\"" +
        escapeAttr(alt) +
        '"></div>' +
        '<div class="slide-overlay gallery-slide-overlay"></div>' +
        '<div class="slide-content gallery-slide-content">' +
        "<p class=\"gallery-slide-caption\">" +
        escapeHtml(caption) +
        "</p>" +
        "</div>";
      container.appendChild(el);
    });

    if (typeof window.initSlideshow === "function") {
      window.initSlideshow(root);
    }
  }

  function renderGallery() {
    var roots = document.querySelectorAll("[data-gallery-slideshow]");
    if (!roots.length) return;
    roots.forEach(renderOne);
  }

  if (window.ShopData && typeof window.ShopData.whenReady === "function") {
    window.ShopData.whenReady().then(renderGallery);
  } else {
    renderGallery();
  }
})();
