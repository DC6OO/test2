(function (global) {
  var PRODUCTS_KEY = "connieShopProducts";
  var GALLERY_KEY = "connieShopGallery";
  var SLIDESHOW_KEY = "connieShopSlideshow";

  var DEFAULT_GALLERY = [
    {
      id: "gal-monster",
      caption: "Character birthday cake",
      alt: "Pink furry monster character birthday cake with Happy Birthday topper",
      image: "images/monster-cake.png",
    },
    {
      id: "gal-pearl",
      caption: "Pearl wedding cake",
      alt: "Four-tier white wedding cake with pearl draping and gold A&K monogram",
      image: "images/wedding-pearl-cake.png",
    },
    {
      id: "gal-rose",
      caption: "Red rose wedding cake",
      alt: "Four-tier white wedding cake with red roses, red beads, and gold A&K monogram",
      image: "images/wedding-rose-cake.png",
    },
    {
      id: "gal-slices",
      caption: "Fresh cake slices",
      alt: "Wrapped red velvet, chocolate, and vanilla cake slices with pink rose petals",
      image: "images/cake-slices.png",
    },
  ];

  var DEFAULT_SLIDES = [
    {
      id: "slide-1",
      image: "images/monster-cake.png",
      eyebrow: "Atelier cakes",
      title: "Connie's Cake Shop",
      titleClass: "brand-title",
      lede: "Bespoke celebration cakes crafted for unforgettable occasions.",
    },
    {
      id: "slide-2",
      image: "images/wedding-pearl-cake.png",
      eyebrow: "Wedding collection",
      title: "Pearl & ivory tiers",
      titleClass: "",
      lede: "Refined finishes, soft florals, and monogram detailing.",
    },
    {
      id: "slide-3",
      image: "images/wedding-rose-cake.png",
      eyebrow: "Signature florals",
      title: "Rouge roses & gold",
      titleClass: "",
      lede: "Dramatic wedding cakes with cascading beads and couture blooms.",
    },
    {
      id: "slide-4",
      image: "images/cake-slices.png",
      eyebrow: "Tasting selection",
      title: "Velvet, chocolate & vanilla",
      titleClass: "",
      lede: "Layered slices for tasting tables, gifting, and refined gatherings.",
    },
  ];

  function readJson(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return fallback;
      var parsed = JSON.parse(raw);
      return parsed;
    } catch (e) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function defaultProductsFromMenu() {
    var menu = global.MENU_ITEMS || {};
    var list = [];
    ["cakes", "finger-foods"].forEach(function (cat) {
      (menu[cat] || []).forEach(function (item) {
        list.push({
          id: item.id,
          name: item.name,
          price: item.price,
          category: cat,
          flavors: item.flavors ? item.flavors.slice() : ["Standard"],
          image: "",
        });
      });
    });
    return list;
  }

  function ensureProductsSeeded() {
    var existing = readJson(PRODUCTS_KEY, null);
    if (Array.isArray(existing) && existing.length > 0) return existing;
    var seeded = defaultProductsFromMenu();
    writeJson(PRODUCTS_KEY, seeded);
    return seeded;
  }

  function getProducts(category) {
    var all = ensureProductsSeeded();
    if (!category) return all;
    return all.filter(function (p) {
      return p.category === category;
    });
  }

  function saveProducts(list) {
    writeJson(PRODUCTS_KEY, list);
    if (global.ShopSync) global.ShopSync.push("products", list);
  }

  function upsertProduct(product) {
    var all = ensureProductsSeeded();
    var idx = -1;
    for (var i = 0; i < all.length; i++) {
      if (all[i].id === product.id) {
        idx = i;
        break;
      }
    }
    if (idx >= 0) all[idx] = product;
    else all.push(product);
    saveProducts(all);
    return all;
  }

  function deleteProduct(id) {
    var all = ensureProductsSeeded().filter(function (p) {
      return p.id !== id;
    });
    saveProducts(all);
    return all;
  }

  function getGallery() {
    var list = readJson(GALLERY_KEY, null);
    if (Array.isArray(list) && list.length > 0) return list;
    return DEFAULT_GALLERY.slice();
  }

  function saveGallery(list) {
    writeJson(GALLERY_KEY, list);
    if (global.ShopSync) global.ShopSync.push("gallery", list);
  }

  function addGalleryItem(item) {
    var list = getGallery().slice();
    // If still on defaults (not persisted), persist copy first
    if (!readJson(GALLERY_KEY, null)) {
      list = DEFAULT_GALLERY.slice();
    }
    list.unshift(item);
    saveGallery(list);
    return list;
  }

  function deleteGalleryItem(id) {
    var list = getGallery().filter(function (g) {
      return g.id !== id;
    });
    saveGallery(list);
    return list;
  }

  function getSlideshow() {
    var list = readJson(SLIDESHOW_KEY, null);
    if (Array.isArray(list) && list.length > 0) return list;
    return DEFAULT_SLIDES.slice();
  }

  function saveSlideshow(list) {
    writeJson(SLIDESHOW_KEY, list);
    if (global.ShopSync) global.ShopSync.push("slideshow", list);
  }

  function ensureSlideshowSeeded() {
    var existing = readJson(SLIDESHOW_KEY, null);
    if (Array.isArray(existing) && existing.length > 0) return existing;
    var seeded = DEFAULT_SLIDES.slice();
    saveSlideshow(seeded);
    return seeded;
  }

  function upsertSlide(slide) {
    var all = ensureSlideshowSeeded();
    var idx = -1;
    for (var i = 0; i < all.length; i++) {
      if (all[i].id === slide.id) {
        idx = i;
        break;
      }
    }
    if (idx >= 0) all[idx] = slide;
    else all.push(slide);
    saveSlideshow(all);
    return all;
  }

  function deleteSlide(id) {
    var all = ensureSlideshowSeeded().filter(function (s) {
      return s.id !== id;
    });
    if (all.length === 0) {
      all = DEFAULT_SLIDES.slice();
    }
    saveSlideshow(all);
    return all;
  }

  function fileToDataUrl(file, maxWidth, quality) {
    maxWidth = maxWidth || 900;
    quality = quality || 0.72;
    return new Promise(function (resolve, reject) {
      if (!file || !file.type || file.type.indexOf("image/") !== 0) {
        reject(new Error("Please choose an image file."));
        return;
      }
      var reader = new FileReader();
      reader.onerror = function () {
        reject(new Error("Could not read the image."));
      };
      reader.onload = function () {
        var img = new Image();
        img.onerror = function () {
          reject(new Error("Could not process the image."));
        };
        img.onload = function () {
          var canvas = document.createElement("canvas");
          var scale = Math.min(1, maxWidth / img.width);
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          var ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function toOrderCatalog(category) {
    return getProducts(category).map(function (p) {
      return {
        id: p.id,
        name: p.name,
        price: Number(p.price) || 0,
        flavors: p.flavors && p.flavors.length ? p.flavors : ["Standard"],
        image: p.image || "",
      };
    });
  }

  var readyPromise = null;

  function whenReady() {
    if (!readyPromise) {
      readyPromise = (global.ShopSync ? global.ShopSync.pullAll() : Promise.resolve(null))
        .then(function (remote) {
          if (global.ShopSync) global.ShopSync.applyRemote(remote);
        })
        .catch(function () {});
    }
    return readyPromise;
  }

  whenReady();

  global.ShopData = {
    getProducts: getProducts,
    upsertProduct: upsertProduct,
    deleteProduct: deleteProduct,
    getGallery: getGallery,
    addGalleryItem: addGalleryItem,
    deleteGalleryItem: deleteGalleryItem,
    getSlideshow: getSlideshow,
    ensureSlideshowSeeded: ensureSlideshowSeeded,
    upsertSlide: upsertSlide,
    deleteSlide: deleteSlide,
    fileToDataUrl: fileToDataUrl,
    toOrderCatalog: toOrderCatalog,
    ensureProductsSeeded: ensureProductsSeeded,
    whenReady: whenReady,
    DEFAULT_GALLERY: DEFAULT_GALLERY,
    DEFAULT_SLIDES: DEFAULT_SLIDES,
  };
})(window);
