(function () {
  var ORDERS_STORAGE_KEY = "kaysBakeryOrders";
  var EXPECTED_PASSWORD = "KAY123!";

  var loginSection = document.querySelector("[data-owner-login]");
  var dashboard = document.querySelector("[data-owner-dashboard]");
  var loginForm = document.getElementById("owner-login-form");
  var passwordInput = document.getElementById("owner-password");
  var loginError = document.getElementById("owner-login-error");
  var loginSubmit = document.getElementById("owner-login-submit");
  var logoutBtn = document.getElementById("owner-logout");

  var listEl = document.querySelector("[data-owner-list]");
  var emptyEl = document.getElementById("owner-empty");
  var refreshBtn = document.getElementById("owner-refresh");
  var clearBtn = document.getElementById("owner-clear-all");
  var hintEl = document.getElementById("owner-storage-hint");

  var config = window.SUPABASE_CONFIG || {};
  var supabaseClient = null;

  function showError(message) {
    if (!loginError) return;
    loginError.textContent = message;
    loginError.hidden = !message;
  }

  function showLogin() {
    if (loginSection) loginSection.hidden = false;
    if (dashboard) dashboard.hidden = true;
    document.title = "Owner login — Connie's Cake Shop";
  }

  function showDashboard() {
    if (loginSection) loginSection.hidden = true;
    if (dashboard) dashboard.hidden = false;
    document.title = "Customer orders — Connie's Cake Shop (shop)";
    render();
  }

  function initSupabase() {
    if (!window.supabase || typeof window.supabase.createClient !== "function") {
      showError("Supabase library failed to load. Check your internet connection.");
      return null;
    }
    if (!config.url || !config.anonKey) {
      showError(
        "Supabase is not configured. Open supabase-config.js and add your Project URL and anon key."
      );
      return null;
    }
    return window.supabase.createClient(config.url, config.anonKey);
  }

  function formatMoney(n) {
    return "K" + Number(n).toLocaleString("en-ZM", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }

  function formatWhen(iso) {
    try {
      var d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      return d.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch (e) {
      return iso;
    }
  }

  function escapeHtml(s) {
    var div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }

  function loadOrders() {
    try {
      var raw = localStorage.getItem(ORDERS_STORAGE_KEY);
      if (!raw) return [];
      var list = JSON.parse(raw);
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }

  function saveOrders(orders) {
    try {
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    } catch (e) {
      if (hintEl) {
        hintEl.hidden = false;
        hintEl.textContent =
          "Could not save (storage may be full or disabled). Try another browser or clear old data.";
      }
    }
  }

  function removeOrder(id) {
    var orders = loadOrders().filter(function (o) {
      return o.id !== id;
    });
    saveOrders(orders);
    render();
  }

  function clearAll() {
    if (
      !window.confirm(
        "Remove every order from this list? This cannot be undone on this device."
      )
    ) {
      return;
    }
    try {
      localStorage.removeItem(ORDERS_STORAGE_KEY);
    } catch (e) {}
    render();
  }

  function render() {
    if (!listEl || !emptyEl) return;

    var orders = loadOrders();

    if (hintEl && orders.length > 0) {
      hintEl.hidden = true;
    }

    listEl.innerHTML = "";

    if (orders.length === 0) {
      emptyEl.hidden = false;
      return;
    }

    emptyEl.hidden = true;

    orders.forEach(function (order) {
      var card = document.createElement("article");
      card.className = "owner-order-card";
      card.setAttribute("data-order-id", order.id || "");

      var head = document.createElement("div");
      head.className = "owner-order-head";

      var title = document.createElement("h2");
      title.className = "owner-order-title";
      title.textContent = formatWhen(order.createdAt || "");

      var meta = document.createElement("p");
      meta.className = "owner-order-id muted";
      var metaBits = [];
      if (order.category) {
        metaBits.push(
          order.category === "finger-foods" ? "Finger foods" : "Cakes"
        );
      }
      if (order.id) metaBits.push("Ref: " + order.id);
      meta.textContent = metaBits.join(" · ");

      head.appendChild(title);
      if (metaBits.length) head.appendChild(meta);

      var ul = document.createElement("ul");
      ul.className = "owner-order-lines";
      var items = order.items || [];
      items.forEach(function (it) {
        var li = document.createElement("li");
        li.className = "owner-order-line";
        li.innerHTML =
          "<span class=\"owner-order-line-main\">" +
          escapeHtml(it.name || "") +
          " · " +
          escapeHtml(it.flavor || "") +
          "</span>" +
          "<span class=\"owner-order-line-meta\">× " +
          (it.qty != null ? it.qty : "") +
          " · " +
          formatMoney(it.lineTotal != null ? it.lineTotal : 0) +
          "</span>";
        ul.appendChild(li);
      });

      var totalRow = document.createElement("p");
      totalRow.className = "owner-order-total";
      totalRow.innerHTML =
        "<span>Total</span> <strong>" +
        formatMoney(order.total != null ? order.total : 0) +
        "</strong>";

      card.appendChild(head);
      card.appendChild(ul);
      card.appendChild(totalRow);

      if (order.phone && String(order.phone).trim()) {
        var phoneText = String(order.phone).trim();
        var phoneDigits = phoneText.replace(/\D/g, "");
        var phoneBlock = document.createElement("div");
        phoneBlock.className = "owner-order-phone";
        phoneBlock.innerHTML =
          "<span class=\"owner-order-notes-label\">Customer phone</span>" +
          "<p><a href=\"tel:" +
          phoneDigits +
          "\">" +
          escapeHtml(phoneText) +
          "</a></p>";
        card.appendChild(phoneBlock);
      }

      if (order.notes && String(order.notes).trim()) {
        var notes = document.createElement("div");
        notes.className = "owner-order-notes";
        notes.innerHTML =
          "<span class=\"owner-order-notes-label\">Customer note</span>" +
          "<p>" +
          escapeHtml(String(order.notes).trim()) +
          "</p>";
        card.appendChild(notes);
      }

      var actions = document.createElement("div");
      actions.className = "owner-order-actions";
      var dismiss = document.createElement("button");
      dismiss.type = "button";
      dismiss.className = "btn btn-ghost btn-sm";
      dismiss.textContent = "Mark done / remove";
      dismiss.addEventListener("click", function () {
        removeOrder(order.id);
      });
      actions.appendChild(dismiss);
      card.appendChild(actions);

      listEl.appendChild(card);
    });
  }

  async function checkSession() {
    if (!supabaseClient) {
      showLogin();
      return;
    }
    try {
      var result = await supabaseClient.auth.getSession();
      if (result.data && result.data.session) showDashboard();
      else showLogin();
    } catch (e) {
      showLogin();
    }
  }

  supabaseClient = initSupabase();
  window.getSupabaseClient = function () {
    return supabaseClient;
  };

  if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      showError("");

      if (!supabaseClient) {
        supabaseClient = initSupabase();
        if (!supabaseClient) return;
      }

      var email = (config.ownerEmail || "").trim();
      var password = passwordInput ? passwordInput.value : "";

      if (!email) {
        showError("Owner email is missing in supabase-config.js.");
        return;
      }

      if (!password) {
        showError("Enter the owner password.");
        return;
      }

      if (password !== EXPECTED_PASSWORD) {
        showError("Incorrect password. Try again.");
        if (passwordInput) {
          passwordInput.value = "";
          passwordInput.focus();
        }
        return;
      }

      if (loginSubmit) {
        loginSubmit.disabled = true;
        loginSubmit.textContent = "Signing in…";
      }

      try {
        var result = await supabaseClient.auth.signInWithPassword({
          email: email,
          password: password,
        });

        if (result.error) {
          showError(result.error.message || "Login failed. Check your Supabase user.");
          if (passwordInput) {
            passwordInput.value = "";
            passwordInput.focus();
          }
          return;
        }

        if (passwordInput) passwordInput.value = "";
        showDashboard();
      } catch (err) {
        showError("Could not reach Supabase. Check your config and connection.");
      } finally {
        if (loginSubmit) {
          loginSubmit.disabled = false;
          loginSubmit.textContent = "Log in";
        }
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", async function () {
      if (supabaseClient) {
        try {
          await supabaseClient.auth.signOut();
        } catch (e) {}
      }
      showLogin();
    });
  }

  if (refreshBtn) refreshBtn.addEventListener("click", render);
  if (clearBtn) clearBtn.addEventListener("click", clearAll);

  document.addEventListener("visibilitychange", function () {
    if (!document.hidden && dashboard && !dashboard.hidden) render();
  });

  window.addEventListener("storage", function (e) {
    if (e.key === ORDERS_STORAGE_KEY && dashboard && !dashboard.hidden) render();
  });

  if (supabaseClient) {
    supabaseClient.auth.onAuthStateChange(function (event, session) {
      if (session) showDashboard();
      else showLogin();
    });
  }

  checkSession();
})();
