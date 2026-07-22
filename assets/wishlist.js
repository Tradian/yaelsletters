/* Wish list — Yael's requests, straight to Ian.

   The desk has a little note-box; sending opens her mail app with the note
   already written and addressed (a static site can't send mail itself, and
   this way there's no third-party form service holding her words). */

(function () {
  "use strict";

  var TO = "ian@ourfellowbrands.com";
  var SUBJECT = "From Yael's desk — something I need";

  var form = document.getElementById("wish-form");
  if (!form) return;
  var text = document.getElementById("wish-text");
  var note = document.getElementById("wish-note");

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var body = (text && text.value || "").trim();
    if (!body) { if (text) text.focus(); return; }
    var href = "mailto:" + TO +
      "?subject=" + encodeURIComponent(SUBJECT) +
      "&body=" + encodeURIComponent("Hi Ian,\n\n" + body + "\n\n— Yael");
    window.location.href = href;
    if (note) note.hidden = false;
  });
})();
