/* Atelier — the ink & light engine for Yael's Letters.

   Concept: "ink becomes light." The cursor is a quill nib that draws a
   calligraphic ink ribbon; as each stroke dries it transmutes into rising
   golden embers. Letterforms spill from the stroke and burn off. A sparse
   field of dust motes drifts in the god-rays, and the goat's quill in the
   plate releases a wisp now and then — she is writing the page.

   Two stacked canvases so ink and light can coexist:
     #ink-layer   (mix-blend-mode: multiply) — wet ink, splashes, dark glyphs
     #light-layer (mix-blend-mode: screen)   — embers, motes, blooms

   Dependency-free. Honours prefers-reduced-motion. Click-through. */

(function () {
  "use strict";

  var reduce = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;

  var inkCanvas = document.getElementById("ink-layer");
  var lightCanvas = document.getElementById("light-layer");
  if (!inkCanvas || !lightCanvas) return;
  var ink = inkCanvas.getContext("2d");
  var lit = lightCanvas.getContext("2d");

  // Palette
  var INK_RGB = "27,41,31";       // wet forest ink (multiplied onto paper)
  var CORE = "255,234,184";       // light: warm-white heart
  var MID  = "246,196,108";       // light: golden body
  var EDGE = "231,150,60";        // light: amber fade
  var GLYPHS = "yaelsletters";    // letterforms that spill from the stroke

  var dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
  var W = 0, H = 0;

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    [inkCanvas, lightCanvas].forEach(function (c) {
      c.width = Math.round(W * dpr);
      c.height = Math.round(H * dpr);
      c.style.width = W + "px";
      c.style.height = H + "px";
    });
    ink.setTransform(dpr, 0, 0, dpr, 0, 0);
    lit.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener("resize", resize, { passive: true });

  // --- Flow field: cheap layered trig, smooth curling drift ---------------
  function flow(x, y, t) {
    return (Math.sin(x * 0.0042 + t * 0.20) +
            Math.cos(y * 0.0051 - t * 0.16) +
            Math.sin((x + y) * 0.0029 + t * 0.11)) * Math.PI;
  }

  // --- The quill ribbon ----------------------------------------------------
  // Recent cursor points; drawn as a calligraphic stroke that evaporates.
  var RIBBON_LIFE = 1100;          // ms before a point dries away
  var ribbon = [];                 // {x, y, t, w} — null marks a pen lift

  var pointer = { x: -1, y: -1, has: false };
  var glyphCarry = 0;

  window.addEventListener("pointermove", function (e) {
    var x = e.clientX, y = e.clientY;
    var last = ribbon.length ? ribbon[ribbon.length - 1] : null;
    if (last && Math.hypot(x - last.x, y - last.y) > 140) ribbon.push(null);
    var speed = last ? Math.hypot(x - last.x, y - last.y) : 0;
    // a real nib: slow = swelling pool, fast = fine hairline
    var w = Math.max(1.2, 6.0 - speed * 0.16);
    ribbon.push({ x: x, y: y, t: performance.now(), w: w });
    pointer.x = x; pointer.y = y; pointer.has = true;

    // letterforms spill from the stroke as you travel
    glyphCarry += speed;
    if (glyphCarry > 85 && glyphs.length < 60) {
      glyphCarry = 0;
      spawnGlyph(x, y, speed);
    }
  }, { passive: true });

  window.addEventListener("pointerdown", function (e) {
    splashes.push({ x: e.clientX, y: e.clientY, r: 3, life: 1 });
    bloom(e.clientX, e.clientY, 16);
  }, { passive: true });

  // --- Embers: the light that dried ink becomes ----------------------------
  var MAX_EMBERS = 480;
  var embers = [];

  function spawnEmber(x, y, vx, vy, strong) {
    var p = embers.length < MAX_EMBERS ? {} : null;
    if (!p) {
      for (var i = 0; i < embers.length; i++) {
        if (embers[i].life <= 0) { p = embers[i]; break; }
      }
      if (!p) return;
    } else embers.push(p);
    p.x = x; p.y = y;
    p.vx = (vx || 0) + (Math.random() - 0.5) * 0.4;
    p.vy = (vy || 0) + (Math.random() - 0.5) * 0.4;
    p.life = 1;
    p.decay = 0.005 + Math.random() * 0.007;
    p.r0 = strong ? 6 + Math.random() * 10 : 3 + Math.random() * 6;
    p.grow = strong ? 18 + Math.random() * 24 : 8 + Math.random() * 14;
    p.alpha = (strong ? 0.14 : 0.09) + Math.random() * 0.06;
    p.seed = Math.random() * 1000;
  }

  function bloom(x, y, n) {
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2;
      var s = 0.5 + Math.random() * 2.0;
      spawnEmber(x, y, Math.cos(a) * s, Math.sin(a) * s, true);
    }
  }

  // --- Glyphs: letters that fall from the pen and burn into light ----------
  var glyphs = [];

  function spawnGlyph(x, y, speed) {
    glyphs.push({
      ch: GLYPHS[(Math.random() * GLYPHS.length) | 0],
      x: x, y: y,
      vx: (Math.random() - 0.5) * 0.6,
      vy: 0.2 + Math.random() * 0.3,
      rot: (Math.random() - 0.5) * 0.8,
      vr: (Math.random() - 0.5) * 0.012,
      size: 14 + Math.random() * Math.min(12, speed * 0.5),
      life: 1,
      decay: 0.0045 + Math.random() * 0.0045,
      seed: Math.random() * 1000
    });
  }

  // --- Ambient motes: dust drifting in the god-rays ------------------------
  var motes = [];
  for (var m = 0; m < 70; m++) {
    motes.push({
      x: Math.random(), y: Math.random(),       // kept normalized; survives resize
      r: 0.6 + Math.random() * 1.6,
      drift: 0.08 + Math.random() * 0.18,
      phase: Math.random() * Math.PI * 2,
      seed: Math.random() * 1000
    });
  }

  // --- Ink splashes (pointerdown) ------------------------------------------
  var splashes = [];

  // --- The goat writes ------------------------------------------------------
  var plateArt = document.querySelector(".plate__art");
  var lastQuill = 0;

  function quillWisp(now) {
    if (!plateArt || now - lastQuill < 1700) return;
    lastQuill = now;
    var r = plateArt.getBoundingClientRect();
    if (r.bottom < 0 || r.top > H) return;     // plate off-screen
    var qx = r.left + r.width * 0.40;          // the pen in her hoof
    var qy = r.top + r.height * 0.42;
    spawnEmber(qx, qy, 0.2, -0.5, false);
    if (Math.random() < 0.45 && glyphs.length < 60) spawnGlyph(qx, qy, 6);
  }

  // --- Render loop ----------------------------------------------------------
  function frame(now) {
    var t = now * 0.001;
    ink.clearRect(0, 0, W, H);
    lit.clearRect(0, 0, W, H);

    quillWisp(now);

    // 1) The quill ribbon — drawn newest over oldest, evaporating by age.
    var alive = [];
    var prev = null;
    for (var i = 0; i < ribbon.length; i++) {
      var pt = ribbon[i];
      if (pt === null) { prev = null; if (alive.length && alive[alive.length - 1] !== null) alive.push(null); continue; }
      var age = (now - pt.t) / RIBBON_LIFE;
      if (age >= 1) {
        // the stroke dries: ink transmutes into light
        if (Math.random() < 0.55) spawnEmber(pt.x, pt.y, 0, -0.3, false);
        prev = null;
        continue;
      }
      alive.push(pt);
      if (prev) {
        var a = (1 - age) * 0.5;
        ink.strokeStyle = "rgba(" + INK_RGB + "," + a + ")";
        ink.lineWidth = pt.w * (1 - age * 0.5);
        ink.lineCap = "round";
        ink.beginPath();
        ink.moveTo(prev.x, prev.y);
        ink.lineTo(pt.x, pt.y);
        ink.stroke();
      }
      prev = pt;
    }
    ribbon = alive;

    // 2) Ink splashes — a struck drop, rippling out and gone.
    for (i = splashes.length - 1; i >= 0; i--) {
      var s = splashes[i];
      s.r += 2.8; s.life -= 0.055;
      if (s.life <= 0) { splashes.splice(i, 1); continue; }
      ink.strokeStyle = "rgba(" + INK_RGB + "," + (s.life * 0.4) + ")";
      ink.lineWidth = 1.4;
      ink.beginPath();
      ink.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ink.stroke();
      for (var d = 0; d < 5; d++) {
        var da = s.seedA || (s.seedA = Math.random() * Math.PI * 2);
        var ang2 = da + d * 1.256;
        ink.fillStyle = "rgba(" + INK_RGB + "," + (s.life * 0.3) + ")";
        ink.beginPath();
        ink.arc(s.x + Math.cos(ang2) * s.r * 0.8, s.y + Math.sin(ang2) * s.r * 0.8, 1.1, 0, Math.PI * 2);
        ink.fill();
      }
    }

    // 3) Glyphs — written in ink, then burning off as light.
    lit.globalCompositeOperation = "lighter";
    for (i = glyphs.length - 1; i >= 0; i--) {
      var g = glyphs[i];
      var ang = flow(g.x, g.y, t + g.seed);
      g.vx += Math.cos(ang) * 0.03;
      g.vy += Math.sin(ang) * 0.03 - (g.life < 0.55 ? 0.06 : 0.012); // lifts as it ignites
      g.vx *= 0.95; g.vy *= 0.95;
      g.x += g.vx; g.y += g.vy;
      g.rot += g.vr;
      g.life -= g.decay;
      if (g.life <= 0) { glyphs.splice(i, 1); continue; }
      var env = Math.sin((1 - g.life) * Math.PI);
      var c = g.life > 0.55 ? ink : lit;
      var col = g.life > 0.55
        ? "rgba(" + INK_RGB + "," + (env * 0.5) + ")"
        : "rgba(" + MID + "," + (env * 0.55) + ")";
      c.save();
      c.translate(g.x, g.y);
      c.rotate(g.rot);
      c.font = "italic " + g.size + "px 'EB Garamond', Georgia, serif";
      c.fillStyle = col;
      c.textAlign = "center";
      c.fillText(g.ch, 0, 0);
      c.restore();
    }

    // 4) Embers — dried ink risen into light.
    for (i = 0; i < embers.length; i++) {
      var p = embers[i];
      if (p.life <= 0) continue;
      var fa = flow(p.x, p.y, t + p.seed);
      p.vx += Math.cos(fa) * 0.05;
      p.vy += Math.sin(fa) * 0.05 - 0.05;
      p.vx *= 0.94; p.vy *= 0.94;
      p.x += p.vx; p.y += p.vy;
      p.life -= p.decay;
      var e = Math.sin((1 - p.life) * Math.PI) * p.alpha;
      if (e <= 0.002) continue;
      var rad = p.r0 + (1 - p.life) * p.grow;
      var grad = lit.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad);
      grad.addColorStop(0, "rgba(" + CORE + "," + e + ")");
      grad.addColorStop(0.45, "rgba(" + MID + "," + (e * 0.6) + ")");
      grad.addColorStop(1, "rgba(" + EDGE + ",0)");
      lit.fillStyle = grad;
      lit.beginPath();
      lit.arc(p.x, p.y, rad, 0, Math.PI * 2);
      lit.fill();
    }

    // 5) Motes — the room's dust, breathing in the light.
    for (i = 0; i < motes.length; i++) {
      var mo = motes[i];
      var ma = flow(mo.x * W, mo.y * H, t * 0.4 + mo.seed);
      mo.x += Math.cos(ma) * mo.drift * 0.0004;
      mo.y += (Math.sin(ma) * mo.drift - mo.drift * 0.5) * 0.0004;
      if (mo.y < -0.02) { mo.y = 1.02; mo.x = Math.random(); }
      if (mo.x < -0.02) mo.x = 1.02;
      if (mo.x > 1.02) mo.x = -0.02;
      var tw = 0.5 + 0.5 * Math.sin(t * 1.4 + mo.phase);
      var malpha = 0.05 * tw + 0.015;
      lit.fillStyle = "rgba(" + CORE + "," + malpha + ")";
      lit.beginPath();
      lit.arc(mo.x * W, mo.y * H, mo.r, 0, Math.PI * 2);
      lit.fill();
    }

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
