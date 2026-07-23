(function () {
  function renderSlideshow() {
    var container = document.querySelector(
      "[data-slideshow]:not([data-gallery-slideshow]) [data-slideshow-slides], [data-slideshow-slides]:not([data-gallery-slides])"
    );
    if (!container || !window.ShopData) return;

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

    var slides = window.ShopData.getSlideshow();
    container.innerHTML = "";

    slides.forEach(function (slide, i) {
      var titleClass = String(slide.titleClass || "").trim();
      var el = document.createElement("div");
      el.className = "slide" + (i === 0 ? " is-active" : "");
      el.setAttribute("data-slide", "");
      el.style.setProperty("--slide-index", String(i));
      el.innerHTML =
        '<div class="slide-bg" style="background-image: url(\'' +
        escapeAttr(slide.image) +
        "')\"></div>" +
        '<div class="slide-overlay"></div>' +
        '<div class="slide-content">' +
        '<p class="eyebrow">' +
        escapeHtml(slide.eyebrow || "") +
        "</p>" +
        "<h1" +
        (titleClass ? ' class="' + escapeAttr(titleClass) + '"' : "") +
        ">" +
        escapeHtml(slide.title || "") +
        "</h1>" +
        '<p class="lede">' +
        escapeHtml(slide.lede || "") +
        "</p>" +
        "</div>";
      container.appendChild(el);
    });

    if (typeof window.initSlideshow === "function") {
      var heroRoot = container.closest("[data-slideshow]");
      window.initSlideshow(heroRoot || undefined);
    }
  }

  if (window.ShopData && typeof window.ShopData.whenReady === "function") {
    window.ShopData.whenReady().then(renderSlideshow);
  } else {
    renderSlideshow();
  }
})();
