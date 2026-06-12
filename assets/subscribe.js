/* Subscribe — progressive enhancement for the newsletter sign-up forms.

   Posts the email to the subscribe Worker (which adds it to the Resend
   audience), and shows inline feedback. Until ENDPOINT is set it falls back
   to a gentle "opening soon" message, so the form never looks broken.

   Set ENDPOINT to your deployed Worker URL — see README ("CMS / newsletter"). */

(function () {
  "use strict";

  var ENDPOINT = ""; // ← paste your subscribe Worker URL here, e.g. https://subscribe.yaelsletters.workers.dev

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

  document.querySelectorAll(".subscribe__form").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = form.querySelector('input[type="email"]');
      var email = (input && input.value || "").trim();
      if (!email) return;

      if (!ENDPOINT) {
        message(form, "Sign-ups open very soon — thank you for your patience.");
        return;
      }

      var btn = form.querySelector("button");
      if (btn) btn.disabled = true;
      message(form, "One moment…");

      fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email }),
      })
        .then(function (r) { if (!r.ok) throw new Error("bad status"); return r; })
        .then(function () {
          message(form, "You're on the list. Watch your inbox for the next letter.");
          form.reset();
        })
        .catch(function () {
          message(form, "Hmm — that didn't go through. Please try again in a moment.");
        })
        .finally(function () { if (btn) btn.disabled = false; });
    });
  });
})();
