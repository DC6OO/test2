(function () {
  function start() {
  var category =
    (document.body && document.body.getAttribute("data-order-category")) || "cakes";
  var catalog =
    window.ShopData && typeof window.ShopData.toOrderCatalog === "function"
      ? window.ShopData.toOrderCatalog(category)
      : (window.MENU_ITEMS && window.MENU_ITEMS[category]) || [];
  var PASTRY_ITEMS = catalog.length
    ? catalog
    : [
        {
          id: "bento-2layer",
          name: "Bento 2Layer",
          price: 450,
          flavors: ["Vanilla", "Chocolate", "Red velvet", "Custom"],
        },
      ];

  var linesContainer = document.querySelector("[data-order-lines]");
  var template = document.getElementById("order-line-template");
  var addBtn = document.getElementById("add-pastry-line");
  var form = document.getElementById("pastry-order-form");
  var summaryList = document.querySelector("[data-summary-list]");
  var summaryEmpty = document.querySelector("[data-summary-empty]");
  var summaryTotalEl = document.querySelector("[data-summary-total]");
  var summaryTotalWrap = document.querySelector("[data-summary-total-wrap]");
  var toastEl = document.querySelector("[data-order-toast]");
  var ORDERS_STORAGE_KEY = "kaysBakeryOrders";

  if (!linesContainer || !template || !form) return;

  function renderPriceList() {
    var root = document.querySelector("[data-product-slideshow]");
    var track = document.querySelector("[data-product-slides]");
    var dotsHost = document.querySelector("[data-product-dots]");
    var prevBtn = document.querySelector("[data-product-prev]");
    var nextBtn = document.querySelector("[data-product-next]");
    if (!root || !track) return;

    var items = PASTRY_ITEMS.filter(function (p) {
      return p.image;
    });
    if (!items.length) {
      items = PASTRY_ITEMS.slice();
    }

    track.innerHTML = "";
    if (dotsHost) dotsHost.innerHTML = "";

    if (!items.length) {
      track.innerHTML =
        '<div class="product-slide is-active"><div class="product-slide-media product-card-media-empty"><span>No products yet</span></div></div>';
      return;
    }

    items.forEach(function (p, i) {
      var slide = document.createElement("article");
      slide.className = "product-slide" + (i === 0 ? " is-active" : "");
      slide.setAttribute("data-product-slide", "");
      var media = p.image
        ? '<div class="product-slide-media"><img src="' +
          p.image +
          '" alt="' +
          escapeHtml(p.name) +
          '" /></div>'
        : '<div class="product-slide-media product-card-media-empty"><span>No photo</span></div>';
      slide.innerHTML =
        media +
        '<div class="product-slide-body"><h3>' +
        escapeHtml(p.name) +
        "</h3><p>" +
        formatMoney(p.price) +
        "</p></div>";
      track.appendChild(slide);
    });

    var slides = track.querySelectorAll("[data-product-slide]");
    var total = slides.length;
    var index = 0;
    var timer = null;
    var intervalMs = 4500;

    function show(i) {
      index = ((i % total) + total) % total;
      slides.forEach(function (el, j) {
        el.classList.toggle("is-active", j === index);
      });
      if (dotsHost) {
        dotsHost.querySelectorAll("button").forEach(function (d, j) {
          d.setAttribute("aria-selected", j === index ? "true" : "false");
        });
      }
    }

    function next() {
      show(index + 1);
    }

    function prev() {
      show(index - 1);
    }

    function stop() {
      if (timer) window.clearInterval(timer);
      timer = null;
    }

    function startAuto() {
      stop();
      if (total < 2) return;
      timer = window.setInterval(next, intervalMs);
    }

    if (dotsHost && total > 1) {
      items.forEach(function (_, i) {
        var b = document.createElement("button");
        b.type = "button";
        b.setAttribute("role", "tab");
        b.setAttribute("aria-label", "Go to product " + (i + 1));
        b.setAttribute("aria-selected", i === 0 ? "true" : "false");
        b.addEventListener("click", function () {
          stop();
          show(i);
          startAuto();
        });
        dotsHost.appendChild(b);
      });
    }

    if (nextBtn) {
      nextBtn.hidden = total < 2;
      nextBtn.onclick = function () {
        stop();
        next();
        startAuto();
      };
    }
    if (prevBtn) {
      prevBtn.hidden = total < 2;
      prevBtn.onclick = function () {
        stop();
        prev();
        startAuto();
      };
    }

    root.onmouseenter = stop;
    root.onmouseleave = startAuto;
    show(0);
    startAuto();
  }

  function formatMoney(n) {
    return "K" + Number(n).toLocaleString("en-ZM", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }

  function pastryById(id) {
    for (var i = 0; i < PASTRY_ITEMS.length; i++) {
      if (PASTRY_ITEMS[i].id === id) return PASTRY_ITEMS[i];
    }
    return PASTRY_ITEMS[0];
  }

  function fillPastrySelect(select) {
    select.innerHTML = "";
    var placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Select item";
    placeholder.selected = true;
    placeholder.disabled = true;
    select.appendChild(placeholder);
    PASTRY_ITEMS.forEach(function (p) {
      var opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = p.name + " — " + formatMoney(p.price);
      select.appendChild(opt);
    });
  }

  function fillFlavorSelect(select, pastryId) {
    select.innerHTML = "";
    if (!pastryId) {
      var placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.textContent = "Select flavor";
      placeholder.selected = true;
      placeholder.disabled = true;
      select.appendChild(placeholder);
      select.disabled = true;
      return;
    }
    select.disabled = false;
    var p = pastryById(pastryId);
    p.flavors.forEach(function (fl) {
      var opt = document.createElement("option");
      opt.value = fl;
      opt.textContent = fl;
      select.appendChild(opt);
    });
  }

  function wireLine(line) {
    var pastrySel = line.querySelector(".order-pastry");
    var flavorSel = line.querySelector(".order-flavor");
    var qtyInput = line.querySelector(".order-qty");
    var removeBtn = line.querySelector("[data-remove-line]");

    function syncFlavors() {
      fillFlavorSelect(flavorSel, pastrySel.value);
      line.classList.toggle("has-choice", Boolean(pastrySel.value));
      updateRemoveButtons();
    }

    pastrySel.addEventListener("change", function () {
      syncFlavors();
      updateSummary();
    });
    flavorSel.addEventListener("change", updateSummary);
    qtyInput.addEventListener("input", updateSummary);
    qtyInput.addEventListener("change", updateSummary);

    if (removeBtn) {
      removeBtn.addEventListener("click", function () {
        var all = linesContainer.querySelectorAll("[data-order-line]");
        if (all.length <= 1) {
          pastrySel.selectedIndex = 0;
          fillFlavorSelect(flavorSel, pastrySel.value);
          qtyInput.value = "1";
          line.classList.remove("has-choice");
          updateRemoveButtons();
          updateSummary();
          return;
        }
        line.remove();
        updateRemoveButtons();
        updateSummary();
      });
    }

    syncFlavors();
  }

  function updateRemoveButtons() {
    var rows = linesContainer.querySelectorAll("[data-order-line]");
    var multiple = rows.length > 1;
    rows.forEach(function (line) {
      var btn = line.querySelector("[data-remove-line]");
      var actions = line.querySelector("[data-order-line-actions]");
      var hasChoice = line.classList.contains("has-choice");
      var show = multiple || hasChoice;
      if (btn) btn.hidden = !show;
      if (actions) actions.hidden = !show;
    });
  }

  function addLine() {
    var node = template.content.querySelector("[data-order-line]").cloneNode(true);
    var pastrySel = node.querySelector(".order-pastry");
    fillPastrySelect(pastrySel);
    fillFlavorSelect(node.querySelector(".order-flavor"), "");
    linesContainer.appendChild(node);
    wireLine(node);
    updateRemoveButtons();
    updateSummary();
  }

  function collectOrderLines() {
    var rows = linesContainer.querySelectorAll("[data-order-line]");
    var items = [];
    var total = 0;

    rows.forEach(function (line) {
      var pastrySel = line.querySelector(".order-pastry");
      var flavorSel = line.querySelector(".order-flavor");
      var qtyInput = line.querySelector(".order-qty");
      var id = pastrySel.value;
      if (!id) return;
      var p = pastryById(id);
      var qty = parseInt(qtyInput.value, 10);
      if (isNaN(qty) || qty < 1) qty = 1;
      var lineTotal = p.price * qty;
      total += lineTotal;
      items.push({
        pastryId: id,
        name: p.name,
        flavor: flavorSel.value,
        qty: qty,
        lineTotal: lineTotal,
      });
    });

    return { items: items, total: total };
  }

  function updateSummary() {
    var collected = collectOrderLines();
    var items = collected.items;
    var total = collected.total;

    summaryList.innerHTML = "";
    if (items.length === 0) {
      summaryEmpty.hidden = false;
      summaryTotalWrap.hidden = true;
      summaryTotalEl.textContent = formatMoney(0);
      return;
    }

    summaryEmpty.hidden = true;
    summaryTotalWrap.hidden = false;

    items.forEach(function (item) {
      var li = document.createElement("li");
      li.className = "order-summary-item";
      li.innerHTML =
        "<span class=\"order-summary-item-main\">" +
        escapeHtml(item.name) +
        " · " +
        escapeHtml(item.flavor) +
        "</span>" +
        "<span class=\"order-summary-item-meta\">× " +
        item.qty +
        " · " +
        formatMoney(item.lineTotal) +
        "</span>";
      summaryList.appendChild(li);
    });

    summaryTotalEl.textContent = formatMoney(total);
  }

  function escapeHtml(s) {
    var div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }

  function saveOrderToStorage(order) {
    try {
      var raw = localStorage.getItem(ORDERS_STORAGE_KEY);
      var list = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(list)) list = [];
      list.unshift(order);
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(list));
    } catch (err) {
      /* ignore quota / private mode */
    }
  }

  function buildOrderEmailBody(orderRecord, lines, notes) {
    var when = new Date(orderRecord.createdAt).toLocaleString();
    var body = [];
    body.push("New order from Connie's Cake Shop website");
    body.push("");
    body.push("Order ID: " + orderRecord.id);
    body.push("Category: " + (orderRecord.category === "finger-foods" ? "Finger foods" : "Cakes"));
    body.push("Time: " + when);
    body.push("Phone: " + orderRecord.phone);
    body.push("");
    body.push("Items:");
    lines.forEach(function (line) {
      body.push("• " + line);
    });
    body.push("");
    body.push("Total: " + formatMoney(orderRecord.total));
    if (notes) {
      body.push("");
      body.push("Customer notes: " + notes);
    }
    return body.join("\n");
  }

  function getPhoneNumber() {
    var phoneEl = form.querySelector("[name='phone']");
    return phoneEl ? phoneEl.value.trim() : "";
  }

  function isValidPhone(phone) {
    var digits = phone.replace(/\D/g, "");
    return digits.length >= 9 && digits.length <= 15;
  }

  function sendOrderEmail(orderRecord, lines, notes) {
    var emailConfig = window.EMAIL_CONFIG || {};
    var OWNER_EMAIL = emailConfig.ownerEmail || "Kabusweck311@gmail.com";
    var web3Key = emailConfig.web3formsAccessKey || "";

    if (window.location.protocol === "file:") {
      return Promise.reject(
        new Error(
          "Open the site at http://localhost:5500 (run start-server.bat). Email cannot send from a plain file."
        )
      );
    }

    var message = buildOrderEmailBody(orderRecord, lines, notes);
    var subject = "New Connie's Cake Shop order — " + orderRecord.id;

    // Prefer Web3Forms when configured (more reliable)
    if (web3Key) {
      return fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          access_key: web3Key,
          subject: subject,
          from_name: "Connie's Cake Shop Orders",
          email: OWNER_EMAIL,
          order_id: orderRecord.id,
          placed_at: new Date(orderRecord.createdAt).toLocaleString(),
          phone: orderRecord.phone,
          items: lines.join(" | "),
          total: formatMoney(orderRecord.total),
          notes: notes || "None",
          message: message,
        }),
      })
        .then(function (res) {
          return res.json().then(function (data) {
            return { ok: res.ok, data: data };
          });
        })
        .then(function (result) {
          if (result.ok && result.data && result.data.success) return result.data;
          throw new Error((result.data && result.data.message) || "Web3Forms email failed");
        });
    }

    // Default: FormSubmit (requires one-time activation email click)
    var formData = new FormData();
    formData.append("_subject", subject);
    formData.append("_template", "table");
    formData.append("_captcha", "false");
    formData.append("_honey", "");
    formData.append("order_id", orderRecord.id);
    formData.append(
      "category",
      orderRecord.category === "finger-foods" ? "Finger foods" : "Cakes"
    );
    formData.append("placed_at", new Date(orderRecord.createdAt).toLocaleString());
    formData.append("phone", orderRecord.phone);
    formData.append("items", lines.join(" | "));
    formData.append("total", formatMoney(orderRecord.total));
    formData.append("notes", notes || "None");
    formData.append("message", message);

    return fetch("https://formsubmit.co/ajax/" + encodeURIComponent(OWNER_EMAIL), {
      method: "POST",
      headers: { Accept: "application/json" },
      body: formData,
    })
      .then(function (res) {
        return res.json().then(function (data) {
          return { ok: res.ok, data: data };
        });
      })
      .then(function (result) {
        var data = result.data || {};
        var success =
          result.ok &&
          (data.success === true ||
            data.success === "true" ||
            /submitted successfully/i.test(String(data.message || "")));

        if (success) return data;

        var msg = String(data.message || "Email request failed");
        if (/activation/i.test(msg) || /activate/i.test(msg)) {
          throw new Error(
            "EMAIL NOT ACTIVATED YET.\n\n1) Open " +
            OWNER_EMAIL +
            "\n2) Check Inbox + Spam for an email from FormSubmit\n3) Click “Activate Form”\n4) Place the order again"
          );
        }
        throw new Error(msg);
      });
  }

  function requestEmailActivation() {
    var OWNER_EMAIL = (window.EMAIL_CONFIG && window.EMAIL_CONFIG.ownerEmail) || "Kabusweck311@gmail.com";

    if (window.location.protocol === "file:") {
      window.alert("First open http://localhost:5500/order.html using start-server.bat");
      return;
    }

    var formData = new FormData();
    formData.append("_subject", "Activate Connie's Cake Shop order emails");
    formData.append("_captcha", "false");
    formData.append(
      "message",
      "Please activate order email notifications for Connie's Cake Shop."
    );

    showToast("Sending activation email…");
    fetch("https://formsubmit.co/ajax/" + encodeURIComponent(OWNER_EMAIL), {
      method: "POST",
      headers: { Accept: "application/json" },
      body: formData,
    })
      .then(function (res) {
        return res.json();
      })
      .then(function (data) {
        var msg = (data && data.message) || "Check " + OWNER_EMAIL + " (and Spam).";
        showToast(msg);
        window.alert(
          msg +
            "\n\nOpen " +
            OWNER_EMAIL +
            " → Inbox/Spam → FormSubmit → click Activate Form."
        );
      })
      .catch(function () {
        showToast("Could not request activation email.");
        window.alert("Could not request activation email. Check your internet and try again.");
      });
  }

  function buildWhatsAppOrderMessage(orderRecord, lines, notes) {
    var categoryLabel =
      orderRecord.category === "finger-foods" ? "Finger foods" : "Cakes";
    var parts = [
      "New order — Connie's Cake Shop",
      "Ref: " + orderRecord.id,
      "Category: " + categoryLabel,
      "Customer phone: " + orderRecord.phone,
      "",
      "Items:",
      lines.map(function (line) {
        return "• " + line;
      }).join("\n"),
      "",
      "Total: " + formatMoney(orderRecord.total),
    ];
    if (notes) {
      parts.push("", "Notes: " + notes);
    }
    return parts.join("\n");
  }

  function openOrderWhatsApp(orderRecord, lines, notes) {
    var raw =
      (window.EMAIL_CONFIG && window.EMAIL_CONFIG.whatsappOrderNumber) ||
      "0972107613";
    var digits = String(raw).replace(/\D/g, "");
    if (digits.length === 10 && digits.charAt(0) === "0") {
      digits = "260" + digits.slice(1);
    } else if (digits.length === 9) {
      digits = "260" + digits;
    }
    var text = buildWhatsAppOrderMessage(orderRecord, lines, notes);
    var url =
      "https://wa.me/" + digits + "?text=" + encodeURIComponent(text);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function showToast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.hidden = false;
    toastEl.classList.add("is-visible");
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(function () {
      toastEl.classList.remove("is-visible");
      toastEl.hidden = true;
    }, 5000);
  }

  addLine();
  renderPriceList();

  if (addBtn) addBtn.addEventListener("click", addLine);

  var notifyEmailEl = document.getElementById("order-notify-email");
  if (notifyEmailEl && window.EMAIL_CONFIG && window.EMAIL_CONFIG.ownerEmail) {
    notifyEmailEl.textContent = window.EMAIL_CONFIG.ownerEmail;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var phone = getPhoneNumber();
    if (!phone) {
      showToast("Please enter your phone number before placing an order.");
      var phoneEl = form.querySelector("[name='phone']");
      if (phoneEl) phoneEl.focus();
      return;
    }
    if (!isValidPhone(phone)) {
      showToast("Enter a valid phone number (at least 9 digits).");
      var phoneInput = form.querySelector("[name='phone']");
      if (phoneInput) phoneInput.focus();
      return;
    }

    var collected = collectOrderLines();
    if (collected.items.length === 0) {
      showToast("Please choose at least one menu item first.");
      return;
    }
    var notesEl = form.querySelector("[name='notes']");
    var notes = notesEl && notesEl.value.trim() ? notesEl.value.trim() : "";

    var lines = collected.items.map(function (it) {
      return it.name + " (" + it.flavor + ") × " + it.qty + " — " + formatMoney(it.lineTotal);
    });

    var orderRecord = {
      id: "ord-" + Date.now(),
      createdAt: new Date().toISOString(),
      category: category,
      items: collected.items,
      total: collected.total,
      phone: phone,
      notes: notes,
    };
    saveOrderToStorage(orderRecord);

    var submitBtn = document.getElementById("submit-order");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending…";
    }

    showToast("Placing order…");

    sendOrderEmail(orderRecord, lines, notes)
      .then(function () {
        openOrderWhatsApp(orderRecord, lines, notes);
        showToast("Order saved — opening WhatsApp to send it to the shop.");
        window.alert(
          "Thanks! Your order was saved.\n\nWhatsApp will open with your order for 0972107613 — tap Send to notify the shop.\n\nPhone: " +
            phone +
            "\n\n• " +
            lines.join("\n• ") +
            (notes ? "\n\nNotes: " + notes : "") +
            "\n\nTotal: " +
            formatMoney(orderRecord.total)
        );
      })
      .catch(function (err) {
        openOrderWhatsApp(orderRecord, lines, notes);
        var reason = (err && err.message) || "the email could not be sent";
        showToast("Order saved — opening WhatsApp.");
        window.alert(
          "Your order was saved. WhatsApp will open so you can send it to the shop (0972107613).\n\nEmail note: " +
            reason +
            "\n\n• " +
            lines.join("\n• ") +
            (notes ? "\n\nNotes: " + notes : "") +
            "\n\nTotal: " +
            formatMoney(orderRecord.total)
        );
      })
      .finally(function () {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Place order";
        }
      });
  });

  updateSummary();
  }

  if (window.ShopData && typeof window.ShopData.whenReady === "function") {
    window.ShopData.whenReady().then(start);
  } else {
    start();
  }
})();
