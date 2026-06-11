/* Envelope — clicking a sealed letter cracks the seal, throws the flap
   back, lifts the sheet, then opens the page. Under reduced motion the
   click navigates immediately like a plain link. */

(function () {
  "use strict";

  var reduce = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.querySelectorAll(".envelope").forEach(function (env) {
    env.addEventListener("click", function (e) {
      if (reduce) return;                               // plain navigation
      e.preventDefault();
      if (env.classList.contains("is-opening")) return; // already opening
      env.classList.add("is-opening");
      setTimeout(function () {
        window.location.href = env.href;
      }, 720);
    });
  });
})();
