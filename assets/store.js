/* Storefront + donations — the ONE place to set where the buttons go.

   Paste your real URLs below. A button with a URL opens it in a new tab; a
   button left blank shows a quiet "soon" state until you fill it in. We use
   plain links (not embedded checkout widgets) so the site stays inside its
   strict Content-Security-Policy. See STORE.md for setup + how to deliver to
   already-presold buyers. */

window.STORE = {
  donate: {
    // Your Ko-fi page (leads), e.g. "https://ko-fi.com/yaelsletters"
    kofi: "",
    // Optional Buy Me a Coffee page, e.g. "https://buymeacoffee.com/yaelsletters"
    buymeacoffee: "",
    // Optional Stripe Payment Link, e.g. "https://buy.stripe.com/xxxxxxxx"
    stripe: ""
  },
  books: {
    // Each book's product page on your seller. Ko-fi Shop is the chosen channel
    // (sells + auto-delivers the PDF/ebook via Stripe). The key matches the
    // page's data-book value.
    "letters-from-the-hill": { ebook: "", paper: "" },
    "before-the-rooster":   { ebook: "", paper: "" }
  }
};

(function () {
  "use strict";
  var S = window.STORE || {};
  var each = function (list, fn) { Array.prototype.forEach.call(list, fn); };

  function wire(a, url) {
    if (url) {
      a.setAttribute("href", url);
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener");
      a.classList.remove("is-soon");
      a.removeAttribute("aria-disabled");
      a.removeAttribute("title");
    } else {
      a.classList.add("is-soon");
      a.setAttribute("aria-disabled", "true");
      a.setAttribute("title", "Available soon");
      a.removeAttribute("href");
      a.addEventListener("click", function (e) { e.preventDefault(); });
    }
  }

  each(document.querySelectorAll("a[data-donate]"), function (a) {
    wire(a, (S.donate || {})[a.getAttribute("data-donate")]);
  });
  each(document.querySelectorAll("a[data-buy]"), function (a) {
    var book = (S.books || {})[a.getAttribute("data-book")] || {};
    wire(a, book[a.getAttribute("data-buy")]);
  });

  // drop any "connect here" note once a real donation link exists
  var anyDonate = Object.keys(S.donate || {}).some(function (k) { return S.donate[k]; });
  if (anyDonate) each(document.querySelectorAll("[data-store-note]"), function (n) { n.remove(); });
})();
