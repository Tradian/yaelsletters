/* Book covers — progressive enhancement.

   Each .book-cover carries data-cover="assets/covers/<slug>.jpg". If that image
   exists, swap it in over the typographic cover (which stays as the fallback
   until real art arrives). Silent — does nothing if there's no image yet. */

(function () {
  "use strict";
  var covers = document.querySelectorAll(".book-cover[data-cover]");
  Array.prototype.forEach.call(covers, function (cover) {
    var src = cover.getAttribute("data-cover");
    if (!src) return;
    var probe = new Image();
    probe.onload = function () {
      var img = document.createElement("img");
      img.className = "book-cover__image";
      img.src = src;
      img.alt = cover.getAttribute("data-cover-alt") || "";
      img.loading = "lazy";
      img.decoding = "async";
      cover.insertBefore(img, cover.firstChild);
      cover.classList.add("book-cover--has-image");
    };
    probe.src = src;
  });
})();
