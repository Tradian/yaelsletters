/* The entrance — a subtle veil lifts on load, and a soft goat bleat greets the
   visitor on their first interaction (browsers block audio until then). Plays
   once per session. Yael turns it on/off from her dashboard; the choice lives
   in content/settings.json. If a real recording is dropped at
   assets/goat-bleat.mp3 it's used; otherwise the bleat is synthesized. */
(function () {
  "use strict";

  // --- subtle visual entry: lift the veil ----------------------------------
  var veil = document.getElementById("entry-veil");
  function liftVeil() { if (veil) veil.classList.add("is-lifted"); }
  if (document.readyState === "complete") setTimeout(liftVeil, 80);
  else window.addEventListener("load", function () { setTimeout(liftVeil, 80); });

  // --- state ---------------------------------------------------------------
  var enabledByAdmin = true;          // overridden by settings.json
  var played = false;
  var MUTE_KEY = "ys-entry-muted";    // visitor preference
  var SESSION_KEY = "ys-entry-played";

  function isMuted() { try { return localStorage.getItem(MUTE_KEY) === "1"; } catch (e) { return false; } }
  function setMuted(v) { try { localStorage.setItem(MUTE_KEY, v ? "1" : "0"); } catch (e) {} }

  // --- optional real recording (drop-in) -----------------------------------
  var fileEl = null, fileReady = false;
  (function probeFile() {
    var a = new Audio();
    a.preload = "auto";
    a.addEventListener("canplaythrough", function () { fileReady = true; fileEl = a; }, { once: true });
    a.src = "assets/goat-bleat.mp3";
  })();

  // --- synthesized soft bleat (the goat quaver) ----------------------------
  function synthBleat() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    var ctx = new AC();
    if (ctx.state === "suspended" && ctx.resume) { try { ctx.resume(); } catch (e) {} }
    var t = ctx.currentTime, dur = 0.7;

    var osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(360, t);
    osc.frequency.linearRampToValueAtTime(298, t + dur);

    var lfo = ctx.createOscillator();          // vibrato — the bleating quaver
    lfo.type = "sine";
    lfo.frequency.setValueAtTime(22, t);
    var lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(14, t);
    lfo.connect(lfoGain); lfoGain.connect(osc.frequency);

    var f1 = ctx.createBiquadFilter(); f1.type = "bandpass"; f1.frequency.value = 1100; f1.Q.value = 6;
    var f2 = ctx.createBiquadFilter(); f2.type = "bandpass"; f2.frequency.value = 2200; f2.Q.value = 9;

    var amp = ctx.createGain();                 // soft envelope
    amp.gain.setValueAtTime(0.0001, t);
    amp.gain.exponentialRampToValueAtTime(0.085, t + 0.04);
    amp.gain.setValueAtTime(0.085, t + 0.40);
    amp.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    osc.connect(f1); f1.connect(amp);
    osc.connect(f2); f2.connect(amp);
    amp.connect(ctx.destination);

    osc.start(t); lfo.start(t);
    osc.stop(t + dur + 0.05); lfo.stop(t + dur + 0.05);
    setTimeout(function () { try { ctx.close(); } catch (e) {} }, (dur + 0.25) * 1000);
  }

  function bleat() {
    if (fileReady && fileEl) {
      try { fileEl.currentTime = 0; fileEl.volume = 0.5; var p = fileEl.play(); if (p && p.catch) p.catch(synthBleat); return; }
      catch (e) {}
    }
    synthBleat();
  }

  // --- play once per session on first gesture ------------------------------
  function maybePlay() {
    if (played || !enabledByAdmin || isMuted()) return;
    try { if (sessionStorage.getItem(SESSION_KEY) === "1") { played = true; return; } } catch (e) {}
    played = true;
    try { sessionStorage.setItem(SESSION_KEY, "1"); } catch (e) {}
    bleat();
  }

  var GEST = ["pointerdown", "keydown", "touchstart"];
  function onGesture() { maybePlay(); }
  GEST.forEach(function (t) { window.addEventListener(t, onGesture, { passive: true }); });

  // --- visitor mute control ------------------------------------------------
  var btn = document.getElementById("sound-toggle");
  function updateBtn() {
    if (!btn) return;
    btn.hidden = !enabledByAdmin;
    var on = enabledByAdmin && !isMuted();
    btn.setAttribute("aria-pressed", on ? "true" : "false");
    btn.classList.toggle("is-off", !on);
    btn.setAttribute("title", on ? "Goat sound on — tap to mute" : "Goat sound off — tap to unmute");
  }
  if (btn) {
    btn.addEventListener("pointerdown", function (e) { e.stopPropagation(); });
    btn.addEventListener("click", function () {
      if (!enabledByAdmin) return;
      var nowMuted = !isMuted();
      setMuted(nowMuted);
      updateBtn();
      if (!nowMuted) { bleat(); }   // unmuting gives a little taste
    });
  }

  // --- admin setting -------------------------------------------------------
  fetch("content/settings.json", { cache: "no-store" })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (s) { if (s && typeof s.entrySound === "boolean") enabledByAdmin = s.entrySound; })
    .catch(function () {})
    .then(function () { updateBtn(); });

  updateBtn();
})();
