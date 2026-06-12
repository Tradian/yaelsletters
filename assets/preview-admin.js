(function () {
  "use strict";
  var each = function (l, f) { Array.prototype.forEach.call(l, f); };

  function setState(a, url) {
    if (!a) return;
    if (url) {
      a.setAttribute("href", url);
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener");
      a.classList.remove("is-soon");
      a.removeAttribute("aria-disabled");
    } else {
      a.classList.add("is-soon");
      a.setAttribute("aria-disabled", "true");
      a.removeAttribute("href");
    }
    var key = a.getAttribute("data-prev");
    var pill = document.querySelector('[data-pill="' + key + '"]');
    if (pill) {
      pill.textContent = url ? "● live" : "○ soon";
      pill.classList.toggle("is-live", !!url);
    }
  }

  function val(id) { var el = document.getElementById(id); return el ? el.value.trim() : ""; }

  function priceCaption(node, price) {
    if (node) node.textContent = price ? "Ebook · " + price : "Ebook";
  }

  function refresh() {
    setState(document.querySelector('[data-prev="hill-ebook"]'), val("in-hill-ebook"));
    setState(document.querySelector('[data-prev="hill-paper"]'), val("in-hill-paper"));
    setState(document.querySelector('[data-prev="rooster-ebook"]'), val("in-rooster-ebook"));
    setState(document.querySelector('[data-prev="rooster-paper"]'), val("in-rooster-paper"));
    setState(document.querySelector('[data-prev="bmac"]'), val("in-bmac"));
    setState(document.querySelector('[data-prev="stripe"]'), val("in-stripe"));
    priceCaption(document.querySelector('[data-price="hill"]'), val("in-hill-price"));
    priceCaption(document.querySelector('[data-price="rooster"]'), val("in-rooster-price"));
  }

  each(document.querySelectorAll(".admin input"), function (i) {
    i.addEventListener("input", refresh);
  });

  var ex = document.getElementById("fill-example");
  if (ex) ex.addEventListener("click", function () {
    document.getElementById("in-hill-ebook").value = "https://payhip.com/b/letters-hill";
    document.getElementById("in-hill-price").value = "$4.99";
    document.getElementById("in-rooster-ebook").value = "https://payhip.com/b/before-rooster";
    document.getElementById("in-rooster-price").value = "$4.99";
    document.getElementById("in-bmac").value = "https://buymeacoffee.com/yaelsletters";
    refresh();
  });

  var cl = document.getElementById("clear-all");
  if (cl) cl.addEventListener("click", function () {
    each(document.querySelectorAll(".admin input"), function (i) { i.value = ""; });
    refresh();
  });

  refresh();
})();
