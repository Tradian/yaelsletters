/* Subscribe — progressive enhancement for the newsletter sign-up forms.

   Posts the email to the subscribe Worker (which adds it to the Resend
   audience), with anti-spam protections that don't get in a real reader's way:
     • a honeypot field bots tend to fill (humans never see it),
     • optional Cloudflare Turnstile (invisible bot check) when a site key is set.
   Shows inline feedback; falls back gracefully until ENDPOINT is set.

   Configure: paste your Worker URL into ENDPOINT, and (optionally) your
   Turnstile site key into TURNSTILE_SITEKEY. See README / SECURITY.md. */

(function () {
  "use strict";

  var ENDPOINT = "";            // ← your subscribe Worker URL
  var TURNSTILE_SITEKEY = "";   // ← optional: Cloudflare Turnstile site key

  var forms = Array.prototype.slice.call(document.querySelectorAll(".subscribe__form"));
  if (!forms.length) return;

  // Load Turnstile + render a widget in each form, if a site key is configured.
  if (TURNSTILE_SITEKEY) {
    var s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
    s.async = true; s.defer = true;
    document.head.appendChild(s);
    forms.forEach(function (form) {
      var box = document.createElement("div");
      box.className = "cf-turnstile";
      box.setAttribute("data-sitekey", TURNSTILE_SITEKEY);
      box.style.margin = "0.6rem 0 0";
      form.appendChild(box);
    });
  }

  function message(form, text) {
    var box = form.parentElement.querySelector(".subscribe__msg");
    if (!box) {
      box = document.createElement("p");
      box.className = "subscribe__msg";
      box.setAttribute("role", "status");
      form.parentElement.appendChild(box);
    }
    box.textContent = text;
  }

  forms.forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = form.querySelector('input[type="email"]');
      var hp = form.querySelector('input[name="website"]');
      var email = (input && input.value || "").trim();
      if (!email) return;

      // honeypot: if a bot filled the hidden field, quietly pretend success
      if (hp && hp.value) { message(form, "Thank you — you're all set."); form.reset(); return; }

      if (!ENDPOINT) {
        message(form, "Sign-ups open very soon — thank you for your patience.");
        return;
      }

      var tokenEl = form.querySelector('[name="cf-turnstile-response"]');
      var payload = { email: email, website: hp ? hp.value : "" };
      if (tokenEl && tokenEl.value) payload.token = tokenEl.value;

      var btn = form.querySelector("button");
      if (btn) btn.disabled = true;
      message(form, "One moment…");

      fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then(function (r) { if (!r.ok) throw new Error("bad status"); return r; })
        .then(function () {
          message(form, "You're on the list. Watch your inbox for the next letter.");
          form.reset();
          if (window.turnstile) try { window.turnstile.reset(); } catch (e) {}
        })
        .catch(function () {
          message(form, "Hmm — that didn't go through. Please try again in a moment.");
        })
        .finally(function () { if (btn) btn.disabled = false; });
    });
  });
})();
