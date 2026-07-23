(function () {
  var config = window.EMAIL_CONFIG || {};
  var ownerEmail = config.ownerEmail || "";

  function showStatus(form, message, isError) {
    var el = form.querySelector("[data-enquiry-status]");
    if (!el) return;
    el.hidden = !message;
    el.textContent = message || "";
    el.style.color = isError ? "#8b3a3a" : "";
  }

  function sendViaFormSubmit(payload) {
    if (!ownerEmail) return Promise.reject(new Error("Owner email is not configured."));
    var endpoint = "https://formsubmit.co/ajax/" + encodeURIComponent(ownerEmail);
    return fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    }).then(function (res) {
      if (!res.ok) throw new Error("Could not send your message.");
      return res.json();
    });
  }

  function sendViaWeb3Forms(payload) {
    var key = config.web3formsAccessKey;
    if (!key) return Promise.reject(new Error("no-key"));
    return fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(
        Object.assign({}, payload, {
          access_key: key,
          subject: payload._subject || "Connie's Cake Shop enquiry",
        })
      ),
    }).then(function (res) {
      if (!res.ok) throw new Error("Could not send your message.");
      return res.json();
    });
  }

  document.querySelectorAll("[data-enquiry-form]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var type = form.getAttribute("data-enquiry-type") || "Enquiry";
      var data = new FormData(form);
      var name = String(data.get("name") || "").trim();
      var phone = String(data.get("phone") || "").trim();
      var email = String(data.get("email") || "").trim();
      var message = String(data.get("message") || "").trim();
      var service = String(data.get("service") || "").trim();
      var eventDate = String(data.get("eventDate") || "").trim();
      var guests = String(data.get("guests") || "").trim();

      if (!name || !phone) {
        showStatus(form, "Please enter your name and phone number.", true);
        return;
      }

      var lines = [
        "Type: " + type,
        "Name: " + name,
        "Phone: " + phone,
        email ? "Email: " + email : "",
        service ? "Service: " + service : "",
        eventDate ? "Date needed: " + eventDate : "",
        guests ? "Guests: " + guests : "",
        message ? "Message:\n" + message : "",
      ].filter(Boolean);

      var payload = {
        name: name,
        phone: phone,
        email: email || "no-reply@example.com",
        message: lines.join("\n"),
        _subject: "Connie's Cake Shop — " + type,
      };

      var submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Sending…";
      }
      showStatus(form, "Sending…");

      var send = config.web3formsAccessKey
        ? sendViaWeb3Forms(payload)
        : sendViaFormSubmit(payload);

      send
        .then(function () {
          form.reset();
          showStatus(form, "Thank you — your message was sent. We will contact you soon.");
        })
        .catch(function (err) {
          showStatus(
            form,
            (err && err.message) ||
              "Could not send. Try WhatsApp or call us, or open the site via localhost.",
            true
          );
        })
        .finally(function () {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = submitBtn.getAttribute("data-label") || "Submit";
          }
        });
    });

    var btn = form.querySelector('button[type="submit"]');
    if (btn) btn.setAttribute("data-label", btn.textContent);
  });
})();
