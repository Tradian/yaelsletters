/* The bookcase — pointer parallax + lamplight, and real-cover drop-in.
   Each .book3d turns gently toward the cursor; a sheen tracks the pointer.
   Real art at assets/covers/<slug>.jpg replaces the typographic front. */
(function () {
  "use strict";
  var each = function (l, f) { Array.prototype.forEach.call(l, f); };

  // real cover art → onto the front face when it exists
  each(document.querySelectorAll(".book3d__front[data-cover]"), function (front) {
    var src = front.getAttribute("data-cover");
    if (!src) return;
    var img = new Image();
    img.onload = function () {
      front.style.backgroundImage = "url('" + src + "')";
      front.classList.add("has-cover");
    };
    img.src = src;
  });

  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  each(document.querySelectorAll(".book3d"), function (book) {
    var link = book.querySelector(".book3d__link");
    var caseEl = book.querySelector(".book3d__case");
    var sheen = book.querySelector(".cover-sheen");
    if (!link || !caseEl) return;

    link.addEventListener("pointermove", function (e) {
      if (e.pointerType === "touch") return;
      var r = caseEl.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width;   // 0..1
      var y = (e.clientY - r.top) / r.height;
      var turn = 20 + (0.5 - x) * 24;            // base 20deg; more spine as the cursor moves left
      var tilt = 5 + (y - 0.5) * -12;
      caseEl.style.transform =
        "translateY(-16px) rotateX(" + tilt.toFixed(2) + "deg) rotateY(" + turn.toFixed(2) + "deg)";
      if (sheen) {
        sheen.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
        sheen.style.setProperty("--my", (y * 100).toFixed(1) + "%");
      }
    }, { passive: true });

    link.addEventListener("pointerleave", function () {
      caseEl.style.transform = "";   // ease back to the CSS rest pose
    });
  });
})();
