(function () {
  if (!window.ShopData) return;

  var dashboard = document.querySelector("[data-owner-dashboard]");
  var productForm = document.getElementById("product-form");
  var galleryForm = document.getElementById("gallery-form");
  var slideForm = document.getElementById("slide-form");
  if (!dashboard || !productForm || !galleryForm || !slideForm) return;

  var productIdEl = document.getElementById("product-id");
  var productNameEl = document.getElementById("product-name");
  var productPriceEl = document.getElementById("product-price");
  var productCategoryEl = document.getElementById("product-category");
  var productFlavorsEl = document.getElementById("product-flavors");
  var productImageEl = document.getElementById("product-image");
  var productPreview = document.getElementById("product-preview");
  var productPreviewImg = document.getElementById("product-preview-img");
  var productStatus = document.getElementById("product-form-status");
  var productSaveBtn = document.getElementById("product-save-btn");
  var productResetBtn = document.getElementById("product-reset-btn");
  var productsList = document.getElementById("admin-products-list");

  var galleryCaptionEl = document.getElementById("gallery-caption");
  var galleryImageEl = document.getElementById("gallery-image");
  var galleryPreview = document.getElementById("gallery-preview");
  var galleryPreviewImg = document.getElementById("gallery-preview-img");
  var galleryStatus = document.getElementById("gallery-form-status");
  var galleryList = document.getElementById("admin-gallery-list");

  var slideIdEl = document.getElementById("slide-id");
  var slideEyebrowEl = document.getElementById("slide-eyebrow");
  var slideTitleEl = document.getElementById("slide-title");
  var slideBrandTitleEl = document.getElementById("slide-brand-title");
  var slideLedeEl = document.getElementById("slide-lede");
  var slideImageEl = document.getElementById("slide-image");
  var slidePreview = document.getElementById("slide-preview");
  var slidePreviewImg = document.getElementById("slide-preview-img");
  var slideStatus = document.getElementById("slide-form-status");
  var slideSaveBtn = document.getElementById("slide-save-btn");
  var slideResetBtn = document.getElementById("slide-reset-btn");
  var slidesList = document.getElementById("admin-slides-list");

  var pendingProductImage = "";
  var pendingGalleryImage = "";
  var pendingSlideImage = "";
  var productFilter = "all";

  function formatMoney(n) {
    return "K" + Number(n).toLocaleString("en-ZM", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }

  function escapeHtml(s) {
    var div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }

  function showStatus(el, message) {
    if (!el) return;
    el.hidden = !message;
    el.textContent = message || "";
  }

  function slugify(text) {
    return String(text || "item")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 40);
  }

  function resetProductForm() {
    productForm.reset();
    if (productIdEl) productIdEl.value = "";
    pendingProductImage = "";
    if (productPreview) productPreview.hidden = true;
    if (productPreviewImg) productPreviewImg.removeAttribute("src");
    if (productSaveBtn) productSaveBtn.textContent = "Save product";
    showStatus(productStatus, "");
  }

  function fillProductForm(product) {
    if (productIdEl) productIdEl.value = product.id || "";
    if (productNameEl) productNameEl.value = product.name || "";
    if (productPriceEl) productPriceEl.value = product.price != null ? product.price : "";
    if (productCategoryEl) productCategoryEl.value = product.category || "cakes";
    if (productFlavorsEl) {
      productFlavorsEl.value = (product.flavors || []).join(", ");
    }
    pendingProductImage = product.image || "";
    if (product.image && productPreview && productPreviewImg) {
      productPreviewImg.src = product.image;
      productPreview.hidden = false;
    } else if (productPreview) {
      productPreview.hidden = true;
    }
    if (productSaveBtn) productSaveBtn.textContent = "Update product";
    productForm.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function resetSlideForm() {
    slideForm.reset();
    if (slideIdEl) slideIdEl.value = "";
    pendingSlideImage = "";
    if (slidePreview) slidePreview.hidden = true;
    if (slidePreviewImg) slidePreviewImg.removeAttribute("src");
    if (slideBrandTitleEl) slideBrandTitleEl.checked = false;
    if (slideSaveBtn) slideSaveBtn.textContent = "Save slide";
    showStatus(slideStatus, "");
  }

  function fillSlideForm(slide) {
    if (slideIdEl) slideIdEl.value = slide.id || "";
    if (slideEyebrowEl) slideEyebrowEl.value = slide.eyebrow || "";
    if (slideTitleEl) slideTitleEl.value = slide.title || "";
    if (slideBrandTitleEl) {
      slideBrandTitleEl.checked = String(slide.titleClass || "").indexOf("brand-title") !== -1;
    }
    if (slideLedeEl) slideLedeEl.value = slide.lede || "";
    pendingSlideImage = slide.image || "";
    if (slide.image && slidePreview && slidePreviewImg) {
      slidePreviewImg.src = slide.image;
      slidePreview.hidden = false;
    } else if (slidePreview) {
      slidePreview.hidden = true;
    }
    if (slideSaveBtn) slideSaveBtn.textContent = "Update slide";
    slideForm.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderProducts() {
    if (!productsList) return;
    var items = window.ShopData.getProducts();
    if (productFilter !== "all") {
      items = items.filter(function (p) {
        return p.category === productFilter;
      });
    }

    productsList.innerHTML = "";
    if (!items.length) {
      productsList.innerHTML = '<p class="muted">No products in this filter yet.</p>';
      return;
    }

    items.forEach(function (product) {
      var card = document.createElement("article");
      card.className = "admin-product-card";

      var media = document.createElement("div");
      media.className = "admin-product-media";
      if (product.image) {
        var img = document.createElement("img");
        img.src = product.image;
        img.alt = product.name || "Product";
        media.appendChild(img);
      } else {
        media.innerHTML = '<span class="muted">No photo</span>';
      }

      var body = document.createElement("div");
      body.className = "admin-product-body";
      body.innerHTML =
        "<h3>" +
        escapeHtml(product.name || "Untitled") +
        "</h3>" +
        '<p class="admin-product-meta">' +
        escapeHtml(formatMoney(product.price)) +
        " · " +
        escapeHtml(product.category === "finger-foods" ? "Finger Foods" : "Cakes") +
        "</p>";

      var actions = document.createElement("div");
      actions.className = "admin-form-actions";

      var edit = document.createElement("button");
      edit.type = "button";
      edit.className = "btn btn-ghost btn-sm";
      edit.textContent = "Edit";
      edit.addEventListener("click", function () {
        fillProductForm(product);
      });

      var del = document.createElement("button");
      del.type = "button";
      del.className = "btn btn-ghost btn-sm owner-danger";
      del.textContent = "Remove";
      del.addEventListener("click", function () {
        if (!window.confirm("Remove this product?")) return;
        window.ShopData.deleteProduct(product.id);
        renderProducts();
        showStatus(productStatus, "Product removed.");
      });

      actions.appendChild(edit);
      actions.appendChild(del);
      body.appendChild(actions);
      card.appendChild(media);
      card.appendChild(body);
      productsList.appendChild(card);
    });
  }

  function renderGallery() {
    if (!galleryList) return;
    var items = window.ShopData.getGallery();
    galleryList.innerHTML = "";
    if (!items.length) {
      galleryList.innerHTML = '<p class="muted">No gallery photos yet.</p>';
      return;
    }

    items.forEach(function (item) {
      var card = document.createElement("article");
      card.className = "admin-gallery-card";

      var img = document.createElement("img");
      img.src = item.image;
      img.alt = item.alt || item.caption || "Gallery photo";

      var body = document.createElement("div");
      body.className = "admin-gallery-body";
      body.innerHTML = "<h3>" + escapeHtml(item.caption || "Untitled") + "</h3>";

      var del = document.createElement("button");
      del.type = "button";
      del.className = "btn btn-ghost btn-sm owner-danger";
      del.textContent = "Remove";
      del.addEventListener("click", function () {
        if (!window.confirm("Remove this gallery photo?")) return;
        window.ShopData.deleteGalleryItem(item.id);
        renderGallery();
        showStatus(galleryStatus, "Gallery photo removed.");
      });

      body.appendChild(del);
      card.appendChild(img);
      card.appendChild(body);
      galleryList.appendChild(card);
    });
  }

  function renderSlides() {
    if (!slidesList) return;
    var items = window.ShopData.ensureSlideshowSeeded();
    slidesList.innerHTML = "";
    if (!items.length) {
      slidesList.innerHTML = '<p class="muted">No background slides yet.</p>';
      return;
    }

    items.forEach(function (slide, index) {
      var card = document.createElement("article");
      card.className = "admin-gallery-card";

      var img = document.createElement("img");
      img.src = slide.image;
      img.alt = slide.title || "Background slide";

      var body = document.createElement("div");
      body.className = "admin-gallery-body";
      body.innerHTML =
        "<h3>Slide " +
        (index + 1) +
        ": " +
        escapeHtml(slide.title || "Untitled") +
        "</h3>" +
        '<p class="muted">' +
        escapeHtml(slide.eyebrow || "") +
        "</p>";

      var actions = document.createElement("div");
      actions.className = "admin-form-actions";

      var edit = document.createElement("button");
      edit.type = "button";
      edit.className = "btn btn-ghost btn-sm";
      edit.textContent = "Edit";
      edit.addEventListener("click", function () {
        fillSlideForm(slide);
      });

      var del = document.createElement("button");
      del.type = "button";
      del.className = "btn btn-ghost btn-sm owner-danger";
      del.textContent = "Remove";
      del.addEventListener("click", function () {
        if (!window.confirm("Remove this background slide?")) return;
        window.ShopData.deleteSlide(slide.id);
        renderSlides();
        resetSlideForm();
        showStatus(slideStatus, "Slide removed. Homepage will update on refresh.");
      });

      actions.appendChild(edit);
      actions.appendChild(del);
      body.appendChild(actions);
      card.appendChild(img);
      card.appendChild(body);
      slidesList.appendChild(card);
    });
  }

  function setupTabs() {
    var tabs = document.querySelectorAll("[data-owner-tab]");
    var panels = document.querySelectorAll("[data-owner-panel]");
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        var target = tab.getAttribute("data-owner-tab");
        tabs.forEach(function (t) {
          var on = t === tab;
          t.classList.toggle("is-active", on);
          t.setAttribute("aria-selected", on ? "true" : "false");
        });
        panels.forEach(function (panel) {
          var on = panel.getAttribute("data-owner-panel") === target;
          panel.hidden = !on;
          panel.classList.toggle("is-active", on);
        });
        if (target === "products") renderProducts();
        if (target === "gallery") renderGallery();
        if (target === "background") renderSlides();
      });
    });
  }

  document.querySelectorAll("[data-product-filter]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      productFilter = btn.getAttribute("data-product-filter") || "all";
      document.querySelectorAll("[data-product-filter]").forEach(function (b) {
        b.classList.toggle("is-active", b === btn);
      });
      renderProducts();
    });
  });

  function handleImageUpload(file, folder, maxWidth, quality, statusEl, previewImg, previewWrap, onReady) {
    if (!file) return;
    showStatus(statusEl, "Uploading photo to cloud…");
    var upload =
      window.ImageStorage && typeof window.ImageStorage.uploadImage === "function"
        ? window.ImageStorage.uploadImage(file, folder, maxWidth, quality)
        : window.ShopData.fileToDataUrl(file, maxWidth, quality);

    upload
      .then(function (url) {
        onReady(url);
        if (previewImg) previewImg.src = url;
        if (previewWrap) previewWrap.hidden = false;
        showStatus(
          statusEl,
          window.ImageStorage
            ? "Photo saved to cloud storage."
            : "Photo ready (saved on this device only)."
        );
      })
      .catch(function (err) {
        showStatus(statusEl, err.message || "Could not upload that photo.");
      });
  }

  if (productImageEl) {
    productImageEl.addEventListener("change", function () {
      var file = productImageEl.files && productImageEl.files[0];
      handleImageUpload(
        file,
        "products",
        900,
        0.72,
        productStatus,
        productPreviewImg,
        productPreview,
        function (url) {
          pendingProductImage = url;
        }
      );
    });
  }

  if (galleryImageEl) {
    galleryImageEl.addEventListener("change", function () {
      var file = galleryImageEl.files && galleryImageEl.files[0];
      handleImageUpload(
        file,
        "gallery",
        1200,
        0.78,
        galleryStatus,
        galleryPreviewImg,
        galleryPreview,
        function (url) {
          pendingGalleryImage = url;
        }
      );
    });
  }

  if (slideImageEl) {
    slideImageEl.addEventListener("change", function () {
      var file = slideImageEl.files && slideImageEl.files[0];
      handleImageUpload(
        file,
        "slideshow",
        1600,
        0.8,
        slideStatus,
        slidePreviewImg,
        slidePreview,
        function (url) {
          pendingSlideImage = url;
        }
      );
    });
  }

  productForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = productNameEl.value.trim();
    var price = parseFloat(productPriceEl.value);
    var category = productCategoryEl.value;
    var flavors = productFlavorsEl.value
      .split(",")
      .map(function (f) {
        return f.trim();
      })
      .filter(Boolean);

    if (!name || isNaN(price) || price < 0) {
      showStatus(productStatus, "Enter a valid name and price.");
      return;
    }

    var id = productIdEl.value.trim() || slugify(name) + "-" + Date.now();
    var existing = window.ShopData.getProducts().find(function (p) {
      return p.id === id;
    });

    window.ShopData.upsertProduct({
      id: id,
      name: name,
      price: price,
      category: category,
      flavors: flavors.length ? flavors : ["Standard"],
      image: pendingProductImage || (existing && existing.image) || "",
    });

    renderProducts();
    resetProductForm();
    showStatus(productStatus, "Product saved. It will show on the customer pages.");
  });

  if (productResetBtn) productResetBtn.addEventListener("click", resetProductForm);

  galleryForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var caption = galleryCaptionEl.value.trim();
    if (!caption) {
      showStatus(galleryStatus, "Add a caption.");
      return;
    }
    if (!pendingGalleryImage) {
      showStatus(galleryStatus, "Choose a photo first.");
      return;
    }

    window.ShopData.addGalleryItem({
      id: "gal-" + Date.now(),
      caption: caption,
      alt: caption,
      image: pendingGalleryImage,
    });

    galleryForm.reset();
    pendingGalleryImage = "";
    if (galleryPreview) galleryPreview.hidden = true;
    if (galleryPreviewImg) galleryPreviewImg.removeAttribute("src");
    renderGallery();
    showStatus(galleryStatus, "Gallery photo added to the homepage.");
  });

  slideForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var eyebrow = slideEyebrowEl.value.trim();
    var title = slideTitleEl.value.trim();
    var lede = slideLedeEl.value.trim();

    if (!eyebrow || !title || !lede) {
      showStatus(slideStatus, "Fill in all text fields.");
      return;
    }

    var id = slideIdEl.value.trim() || "slide-" + Date.now();
    var existing = window.ShopData.getSlideshow().find(function (s) {
      return s.id === id;
    });
    var image = pendingSlideImage || (existing && existing.image) || "";
    if (!image) {
      showStatus(slideStatus, "Choose a background photo.");
      return;
    }

    window.ShopData.upsertSlide({
      id: id,
      image: image,
      eyebrow: eyebrow,
      title: title,
      titleClass: slideBrandTitleEl && slideBrandTitleEl.checked ? "brand-title" : "",
      lede: lede,
    });

    renderSlides();
    resetSlideForm();
    showStatus(slideStatus, "Background saved. Refresh the homepage to see it.");
  });

  if (slideResetBtn) slideResetBtn.addEventListener("click", resetSlideForm);

  setupTabs();

  var observer = new MutationObserver(function () {
    if (!dashboard.hidden) {
      window.ShopData.ensureProductsSeeded();
      window.ShopData.ensureSlideshowSeeded();
      renderProducts();
      renderGallery();
      renderSlides();
    }
  });
  observer.observe(dashboard, { attributes: true, attributeFilter: ["hidden"] });

  if (!dashboard.hidden) {
    window.ShopData.ensureProductsSeeded();
    window.ShopData.ensureSlideshowSeeded();
    renderProducts();
    renderGallery();
    renderSlides();
  }
})();
