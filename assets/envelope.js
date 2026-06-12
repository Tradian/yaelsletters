/* Letter card — clicking a sealed note cracks the seal into light, the note
   lifts, then the page opens. Under reduced motion the click navigates
   immediately like a plain link. */

(function () {
  "use strict";

  var reduce = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.querySelectorAll(".letter-card").forEach(function (card) {
    card.addEventListener("click", function (e) {
      if (reduce) return;                                // plain navigation
      e.preventDefault();
      if (card.classList.contains("is-opening")) return; // already opening
      card.classList.add("is-opening");
      setTimeout(function () {
        window.location.href = card.href;
      }, 620);
    });
  });
})();
