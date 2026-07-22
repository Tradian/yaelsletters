/* Desk tour — a gentle first-visit walk around Yael's Desk.

   Shows automatically on her first visit; a dimmed page with a gold ring
   around each card and a little note explaining it, one step at a time.
   She can close it any time (comes back next visit) or tick
   "Don't show this again" (never comes back — stored in localStorage).
   "Show me around again" on the desk restarts it whenever she likes.

   No dependencies; honours prefers-reduced-motion; Esc closes,
   arrow keys move between steps. */

(function () {
  "use strict";

  var DONE_KEY = "ys-desk-tour";           // "done" → never auto-show again
  var SESSION_KEY = "ys-desk-tour-closed"; // closed this visit → stay quiet

  var reduced = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var STEPS = [
    { target: null,
      kicker: "Welcome",
      title: "Welcome to your desk, Yael",
      text: "This little tour walks you around everything — it takes about two minutes. You can close it any time with the ✕, and bring it back with “Show me around again” at the top of the page." },
    { target: '[href="admin/"]',
      kicker: "The one you'll use most",
      title: "Write a Letter",
      text: "Tap this card and your editor opens. Choose “Letters”, then “Create” — write, and press Publish when it's ready. The site updates itself in about three minutes. Then post the same letter on Substack so it reaches everyone's inbox." },
    { target: '[data-link="books"]',
      kicker: "The shelf",
      title: "Books",
      text: "Add a book when it's ready, or edit one — the blurb, the Amazon link, the free PDF. Paste a link and its button goes live on the site; leave one blank and the button waits quietly, saying “soon”." },
    { target: '[data-link="pages"]',
      kicker: "The standing words",
      title: "Pages",
      text: "The words on your About and Support pages live here — your introduction, your note to readers, the Ko-fi link. Edit them the same way as a letter: change, then Publish." },
    { target: '[data-link="subscribers"]',
      kicker: "The flock",
      title: "Subscribers",
      text: "This opens your Substack dashboard, where the email list lives. You'll see everyone who has subscribed — on the site or on Substack, they all land in the same place." },
    { target: '[data-link="donations"]',
      kicker: "The lamp oil",
      title: "Donations",
      text: "This opens Ko-fi, where support given through the site arrives. Nothing to manage — it's just where you go to see it and say thank you." },
    { target: '[data-link="settings"]',
      kicker: "Little switches",
      title: "Sound & settings",
      text: "Site-wide switches — like the soft goat bleat visitors hear when they first arrive. Turn it on or off here." },
    { target: "#wishlist",
      kicker: "Anything at all",
      title: "Your wish list",
      text: "Need something changed, added, or explained? Write it here and it comes straight to Ian. No request is too small — this desk is built around you." },
    { target: null,
      kicker: "That's everything",
      title: "The desk is yours",
      text: "Most days it's just the first card: write, publish, post to Substack. Everything else sits here waiting for when you need it. Until the next letter —" }
  ];

  var idx = 0, open = false;
  var ring, bubble, lastFocus;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  }

  function build() {
    ring = el("div", "tour-ring");
    ring.setAttribute("aria-hidden", "true");

    bubble = el("div", "tour-bubble");
    bubble.setAttribute("role", "dialog");
    bubble.setAttribute("aria-modal", "true");
    bubble.setAttribute("aria-label", "A tour of the desk");

    var close = el("button", "tour-close");
    close.type = "button";
    close.setAttribute("aria-label", "Close the tour");
    close.innerHTML = "&times;";
    close.addEventListener("click", function () { end(false); });

    var kicker = el("p", "tour-kicker");
    var title = el("h2", "tour-title");
    var text = el("p", "tour-text");
    var count = el("p", "tour-count");

    var nav = el("div", "tour-nav");
    var back = el("button", "tour-btn tour-btn--ghost", "Back");
    back.type = "button";
    back.addEventListener("click", function () { go(idx - 1); });
    var next = el("button", "tour-btn", "Next");
    next.type = "button";
    next.addEventListener("click", function () {
      if (idx >= STEPS.length - 1) end(true); else go(idx + 1);
    });
    nav.appendChild(back); nav.appendChild(next);

    var never = el("label", "tour-never");
    var tick = el("input");
    tick.type = "checkbox";
    tick.id = "tour-never-tick";
    never.appendChild(tick);
    never.appendChild(document.createTextNode(" Don’t show this again"));

    bubble.appendChild(close);
    bubble.appendChild(kicker);
    bubble.appendChild(title);
    bubble.appendChild(text);
    bubble.appendChild(nav);
    bubble.appendChild(count);
    bubble.appendChild(never);

    bubble._parts = { kicker: kicker, title: title, text: text, count: count, back: back, next: next, tick: tick };

    document.body.appendChild(ring);
    document.body.appendChild(bubble);
  }

  function place() {
    var step = STEPS[idx];
    var t = step.target && document.querySelector(step.target);
    if (t) {
      var r = t.getBoundingClientRect();
      ring.style.display = "block";
      ring.style.top = (r.top + window.scrollY - 6) + "px";
      ring.style.left = (r.left + window.scrollX - 6) + "px";
      ring.style.width = (r.width + 12) + "px";
      ring.style.height = (r.height + 12) + "px";
    } else {
      // welcome / farewell: dim the whole page, ring collapses to nothing
      ring.style.display = "block";
      ring.style.top = "50%"; ring.style.left = "50%";
      ring.style.width = "0"; ring.style.height = "0";
    }
  }

  function go(i) {
    idx = Math.max(0, Math.min(STEPS.length - 1, i));
    var s = STEPS[idx], p = bubble._parts;
    p.kicker.textContent = s.kicker;
    p.title.textContent = s.title;
    p.text.textContent = s.text;
    p.count.textContent = (idx + 1) + " of " + STEPS.length;
    p.back.style.visibility = idx === 0 ? "hidden" : "visible";
    p.next.textContent = idx >= STEPS.length - 1 ? "All done" : "Next";

    var t = s.target && document.querySelector(s.target);
    if (t) t.scrollIntoView({ block: "center", behavior: reduced ? "auto" : "smooth" });
    // let the scroll settle before measuring
    setTimeout(place, reduced ? 0 : 350);
    place();
    p.next.focus({ preventScroll: true });
  }

  function onKey(e) {
    if (!open) return;
    if (e.key === "Escape") end(false);
    else if (e.key === "ArrowRight") go(idx + 1);
    else if (e.key === "ArrowLeft") go(idx - 1);
  }

  function onMove() { if (open) place(); }

  function start() {
    if (open) return;
    if (!ring) build();
    open = true;
    lastFocus = document.activeElement;
    ring.style.display = "block";
    bubble.style.display = "block";
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onMove);
    window.addEventListener("scroll", onMove, { passive: true });
    go(0);
  }

  function end(finished) {
    open = false;
    ring.style.display = "none";
    bubble.style.display = "none";
    document.removeEventListener("keydown", onKey);
    window.removeEventListener("resize", onMove);
    window.removeEventListener("scroll", onMove);
    try {
      if (bubble._parts.tick.checked) localStorage.setItem(DONE_KEY, "done");
      else if (finished) localStorage.setItem(DONE_KEY, "done");
      else sessionStorage.setItem(SESSION_KEY, "1");
    } catch (e) {}
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  // restart link on the desk
  var again = document.getElementById("tour-again");
  if (again) again.addEventListener("click", function (e) { e.preventDefault(); start(); });

  // auto-show on first visit only
  var done = false, closed = false;
  try {
    done = localStorage.getItem(DONE_KEY) === "done";
    closed = sessionStorage.getItem(SESSION_KEY) === "1";
  } catch (e) {}
  if (!done && !closed) {
    // give the page's own reveal a moment to finish
    setTimeout(start, reduced ? 200 : 900);
  }
})();
