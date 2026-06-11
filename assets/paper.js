/* Paper — the parchment surface, painted once per load.

   No tiled images: the texture is generated at exactly the viewport size,
   so nothing can repeat. Three coats:
     1. per-pixel fine tooth (true grain, a whisper of alpha)
     2. a few huge, ultra-soft tonal pools (smooth by construction)
     3. one gentle vignette for the aged edges
   The canvas blends onto the page with mix-blend-mode: multiply. Static,
   so it stays on even under prefers-reduced-motion. */

(function () {
  "use strict";

  var canvas = document.getElementById("paper-layer");
  if (!canvas) return;
  var ctx = canvas.getContext("2d");
  var dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));

  function paint() {
    var W = window.innerWidth, H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    var w = canvas.width, h = canvas.height;

    // 1) Fine tooth — per-pixel grain in a warm umber, 0–9/255 alpha.
    var img = ctx.createImageData(w, h);
    var d = img.data;
    for (var i = 0; i < d.length; i += 4) {
      d[i] = 58; d[i + 1] = 46; d[i + 2] = 30;
      d[i + 3] = (Math.random() * 10) | 0;
    }
    ctx.putImageData(img, 0, 0);

    // 2) Tonal drift — six enormous, feather-soft pools so the vellum's
    //    tone wanders gently across the page.
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var R = Math.max(W, H);
    for (var k = 0; k < 6; k++) {
      var x = Math.random() * W, y = Math.random() * H;
      var r = R * (0.45 + Math.random() * 0.4);
      var a = 0.012 + Math.random() * 0.016;
      var g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, "rgba(74,58,36," + a + ")");
      g.addColorStop(1, "rgba(74,58,36,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }

    // 3) Aged edges — one soft vignette.
    var v = ctx.createRadialGradient(W / 2, H * 0.42, R * 0.35,
                                     W / 2, H * 0.45, R * 0.85);
    v.addColorStop(0, "rgba(58,42,22,0)");
    v.addColorStop(1, "rgba(58,42,22,0.10)");
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  paint();

  var t;
  window.addEventListener("resize", function () {
    clearTimeout(t);
    t = setTimeout(paint, 200);
  }, { passive: true });
})();
