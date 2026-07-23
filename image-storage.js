(function (global) {
  var config = global.SUPABASE_CONFIG || {};
  var BUCKET = config.storageBucket || "shop-images";

  function getClient() {
    if (typeof global.getSupabaseClient === "function") {
      return global.getSupabaseClient();
    }
    if (!global.supabase || !config.url || !config.anonKey) return null;
    return global.supabase.createClient(config.url, config.anonKey);
  }

  function randomSuffix() {
    return Math.random().toString(36).slice(2, 10);
  }

  function compressToBlob(file, maxWidth, quality) {
    maxWidth = maxWidth || 1200;
    quality = quality || 0.78;
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
          canvas.toBlob(
            function (blob) {
              if (!blob) {
                reject(new Error("Could not prepare the image."));
                return;
              }
              resolve(blob);
            },
            "image/jpeg",
            quality
          );
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function uploadImage(file, folder, maxWidth, quality) {
    var client = getClient();
    if (!client) {
      return Promise.reject(
        new Error("Cloud storage is not available. Check Supabase settings.")
      );
    }

    return client.auth.getSession().then(function (sessionResult) {
      if (!sessionResult.data || !sessionResult.data.session) {
        throw new Error("Log in as owner before uploading photos.");
      }

      return compressToBlob(file, maxWidth, quality).then(function (blob) {
        var safeFolder = String(folder || "uploads").replace(/[^a-z0-9-]/gi, "");
        var path =
          safeFolder + "/" + Date.now() + "-" + randomSuffix() + ".jpg";

        return client.storage
          .from(BUCKET)
          .upload(path, blob, {
            contentType: "image/jpeg",
            cacheControl: "3600",
            upsert: false,
          })
          .then(function (result) {
            if (result.error) throw result.error;
            var publicResult = client.storage.from(BUCKET).getPublicUrl(path);
            return publicResult.data.publicUrl;
          });
      });
    });
  }

  global.ImageStorage = {
    uploadImage: uploadImage,
    compressToBlob: compressToBlob,
  };
})(window);
