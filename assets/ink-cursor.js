/* Ethereal light trail — follows the cursor, curls through a flow field,
   and rises and dissipates like warm light let loose in air.

   Dependency-free. Renders warm divine-light (Prince of Egypt gold) into a
   fixed canvas that the stylesheet blends onto the paper with
   mix-blend-mode: screen, so the swirl adds light rather than darkening it.
   Wisps accumulate additively for luminous cores. Honours
   prefers-reduced-motion and stays quiet on touch-only devices. */

(function () {
  "use strict";

  var reduce = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;

  var canvas = document.getElementById("ink-trail");
  if (!canvas) return;
  var ctx = canvas.getContext("2d");

  // Warm divine light — a luminous core fading out through amber gold.
  // Stored as "r,g,b" strings so each wisp can carry its own alpha.
  var CORE = "255,234,184";   // bright warm-white heart
  var MID  = "246,196,108";   // golden body
  var EDGE = "231,150,60";    // amber fade-out

  var dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
  var W = 0, H = 0;

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener("resize", resize, { passive: true });

  // --- Pointer tracking ----------------------------------------------------
  var pointer = { x: W / 2, y: H / 2, px: W / 2, py: H / 2, active: false };
  var lastMove = 0;

  function onMove(x, y) {
    pointer.px = pointer.x;
    pointer.py = pointer.y;
    pointer.x = x;
    pointer.y = y;
    pointer.active = true;
    lastMove = performance.now();
  }

  window.addEventListener("pointermove", function (e) {
    onMove(e.clientX, e.clientY);
  }, { passive: true });

  window.addEventListener("pointerdown", function (e) {
    onMove(e.clientX, e.clientY);
    // a press releases a little bloom of ink
    bloom(e.clientX, e.clientY, 14);
  }, { passive: true });

  // --- Flow field ----------------------------------------------------------
  // A cheap, smooth pseudo-noise built from layered trig — enough to make the
  // ink curl and wander without a noise library.
  function flowAngle(x, y, t) {
    var n =
      Math.sin(x * 0.0042 + t * 0.20) +
      Math.cos(y * 0.0051 - t * 0.16) +
      Math.sin((x + y) * 0.0029 + t * 0.11);
    return n * Math.PI;
  }

  // --- Particles -----------------------------------------------------------
  var MAX = 620;
  var pool = [];

  function spawn(x, y, vx, vy) {
    var p = pool.length < MAX ? {} : null;
    if (!p) {
      // reuse the oldest expired one if we're at the cap
      for (var i = 0; i < pool.length; i++) {
        if (pool[i].life <= 0) { p = pool[i]; break; }
      }
      if (!p) return;
    } else {
      pool.push(p);
    }
    var a = Math.random() * Math.PI * 2;
    var spread = Math.random() * 0.6;
    p.x = x + Math.cos(a) * spread * 4;
    p.y = y + Math.sin(a) * spread * 4;
    p.vx = vx * 0.18 + (Math.random() - 0.5) * 0.4;
    p.vy = vy * 0.18 + (Math.random() - 0.5) * 0.4;
    p.life = 1;
    p.decay = 0.004 + Math.random() * 0.006;      // ~1.5–3.5s of life
    p.r0 = 5 + Math.random() * 9;                  // starting radius
    p.grow = 16 + Math.random() * 26;              // diffusion over its life
    p.alpha = 0.05 + Math.random() * 0.05;         // peak opacity per wisp
    p.seed = Math.random() * 1000;
  }

  function bloom(x, y, n) {
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2;
      var s = 0.5 + Math.random() * 1.8;
      spawn(x, y, Math.cos(a) * s, Math.sin(a) * s);
    }
  }

  // --- Loop ----------------------------------------------------------------
  var carry = 0; // fractional spawn accumulator

  function frame(now) {
    var t = now * 0.001;

    // Emit along the path the cursor just travelled, denser when moving fast.
    if (pointer.active) {
      var dx = pointer.x - pointer.px;
      var dy = pointer.y - pointer.py;
      var speed = Math.hypot(dx, dy);
      var emit = Math.min(speed * 0.45, 14) + (now - lastMove < 90 ? 0.6 : 0);
      carry += emit;
      var count = carry | 0;
      carry -= count;
      for (var i = 0; i < count; i++) {
        var f = count > 1 ? i / count : 0;
        spawn(pointer.px + dx * f, pointer.py + dy * f, dx, dy);
      }
      pointer.px = pointer.x;
      pointer.py = pointer.y;
    }

    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = "lighter"; // light adds to light

    for (var k = 0; k < pool.length; k++) {
      var p = pool[k];
      if (p.life <= 0) continue;

      // steer along the flow field, with a gentle upward draught
      var ang = flowAngle(p.x, p.y, t + p.seed);
      p.vx += Math.cos(ang) * 0.06;
      p.vy += Math.sin(ang) * 0.06 - 0.045; // rise like incense
      p.vx *= 0.94;
      p.vy *= 0.94;
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;

      // fade in then out across the wisp's life (sin envelope)
      var env = Math.sin((1 - p.life) * Math.PI);
      var radius = p.r0 + (1 - p.life) * p.grow;
      var a = env * p.alpha;
      if (a <= 0.002) continue;

      var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius);
      g.addColorStop(0, "rgba(" + CORE + "," + a + ")");
      g.addColorStop(0.45, "rgba(" + MID + "," + (a * 0.6) + ")");
      g.addColorStop(1, "rgba(" + EDGE + ",0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
