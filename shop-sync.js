(function (global) {
  var TABLE = "shop_settings";
  var REMOTE_KEYS = ["products", "gallery", "slideshow"];
  var LOCAL_KEYS = {
    products: "connieShopProducts",
    gallery: "connieShopGallery",
    slideshow: "connieShopSlideshow",
  };

  function getClient() {
    if (typeof global.getSupabaseClient === "function") {
      return global.getSupabaseClient();
    }
    var config = global.SUPABASE_CONFIG || {};
    if (!global.supabase || !config.url || !config.anonKey) return null;
    return global.supabase.createClient(config.url, config.anonKey);
  }

  function pullAll() {
    var client = getClient();
    if (!client) return Promise.resolve(null);

    return client
      .from(TABLE)
      .select("key, value")
      .then(function (result) {
        if (result.error || !result.data || !result.data.length) return null;
        var out = {};
        result.data.forEach(function (row) {
          if (REMOTE_KEYS.indexOf(row.key) !== -1) out[row.key] = row.value;
        });
        return Object.keys(out).length ? out : null;
      })
      .catch(function () {
        return null;
      });
  }

  function push(key, value) {
    var client = getClient();
    if (!client || REMOTE_KEYS.indexOf(key) === -1) return Promise.resolve();

    return client.auth
      .getSession()
      .then(function (sessionResult) {
        if (!sessionResult.data || !sessionResult.data.session) return null;
        return client.from(TABLE).upsert({
          key: key,
          value: value,
          updated_at: new Date().toISOString(),
        });
      })
      .catch(function () {
        return null;
      });
  }

  function applyRemote(remote) {
    if (!remote) return;
    REMOTE_KEYS.forEach(function (key) {
      if (Array.isArray(remote[key]) && remote[key].length) {
        try {
          localStorage.setItem(LOCAL_KEYS[key], JSON.stringify(remote[key]));
        } catch (e) {}
      }
    });
  }

  global.ShopSync = {
    pullAll: pullAll,
    push: push,
    applyRemote: applyRemote,
    REMOTE_KEYS: REMOTE_KEYS,
  };
})(window);
