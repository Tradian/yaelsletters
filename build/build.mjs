/* Build — turns content/letters/*.md into:
     • letter-<slug>.html   (a reading page per letter)
     • letters.html         (the sealed-envelope index)
     • feed.xml             (RSS, so the newsletter auto-sends on publish)

   No framework. Run with `npm run build`; CI runs it before deploy. */

import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { marked } from "marked";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LETTERS_DIR = join(ROOT, "content", "letters");
const SITE = "https://tradian.github.io/yaelsletters";

marked.setOptions({ mangle: false, headerIds: false });

const MONTHS = ["January","February","March","April","May","June","July",
  "August","September","October","November","December"];

function esc(s = "") {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;");
}

// --- load letters --------------------------------------------------------
const files = readdirSync(LETTERS_DIR).filter((f) => f.endsWith(".md"));
const letters = files.map((file) => {
  const { data, content } = matter(readFileSync(join(LETTERS_DIR, file), "utf8"));
  const date = new Date(data.date);
  return {
    slug: data.slug || file.replace(/\.md$/, ""),
    title: data.title || "Untitled",
    titleHtml: data.title_html || esc(data.title || "Untitled"),
    excerpt: data.excerpt || "",
    sign: data.sign || "Yael",
    seal: (data.seal || "Y").slice(0, 1),
    draft: !!data.draft,
    date,
    monthYear: `${MONTHS[date.getMonth()]} ${date.getFullYear()}`,
    bodyHtml: marked.parse(content.trim()),
  };
})
.filter((l) => !l.draft)
.sort((a, b) => b.date - a.date);

// --- shared chunks -------------------------------------------------------
const head = (title, desc) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Pinyon+Script&display=swap" rel="stylesheet" />
  <link rel="alternate" type="application/rss+xml" title="Yael's Letters" href="feed.xml" />
  <link rel="stylesheet" href="styles.css" />
</head>`;

const nav = (active) => `
    <nav class="nav reveal" style="--d:.1s">
      <a class="nav__mark" href="index.html">Yael&rsquo;s Letters</a>
      <ul class="nav__links">
        <li><a href="letters.html"${active==="letters"?' class="is-active"':""}>The Letters</a></li>
        <li><a href="books.html"${active==="books"?' class="is-active"':""}>Books</a></li>
        <li><a href="support.html"${active==="support"?' class="is-active"':""}>Support</a></li>
        <li><a href="about.html"${active==="about"?' class="is-active"':""}>About</a></li>
      </ul>
    </nav>`;

const subscribe = (title, note) => `
      <section class="subscribe reveal" id="subscribe" style="--d:1s">
        <h2 class="subscribe__title">${title}</h2>
        <p class="subscribe__note">${note}</p>
        <!-- ESP stub: point this form at Kit / Buttondown / Beehiiv when chosen -->
        <form class="subscribe__form" action="#" method="post">
          <label class="visually-hidden" for="email">Email address</label>
          <input id="email" type="email" name="email" placeholder="your@email.com" required />
          <button class="seal-btn" type="submit">Subscribe</button>
        </form>
        <p class="stub-note">Newsletter service connects here &mdash; Kit / Buttondown / Beehiiv</p>
      </section>`;

const footerAndScripts = `
    <footer class="signoff">
      <p class="signoff__line">Until the next letter,</p>
      <p class="signoff__meta">Yael&rsquo;s Letters &middot; YHWH bless you</p>
    </footer>

  </div>

  <!-- Atelier: ink becomes light -->
  <canvas id="paper-layer" aria-hidden="true"></canvas>
  <canvas id="ink-layer" aria-hidden="true"></canvas>
  <canvas id="light-layer" aria-hidden="true"></canvas>
  <script src="assets/paper.js" defer></script>
  <script src="assets/ink-light.js" defer></script>
  __EXTRA_SCRIPTS__
</body>
</html>`;

// --- a reading page ------------------------------------------------------
function letterPage(l) {
  return `${head(`${l.title} — Yael's Letters`, l.excerpt)}
<body>
  <div class="page">
${nav("letters")}
    <main class="inner">

      <p class="kicker reveal" style="--d:.3s">A letter &middot; ${l.monthYear}</p>
      <h1 class="page-title reveal" style="--d:.45s">${l.titleHtml}</h1>

      <article class="letterbody reveal" style="--d:.65s">
        ${l.bodyHtml.trim()}
        <p class="signature">&mdash; ${esc(l.sign)}</p>
      </article>

      <section class="comments reveal" style="--d:.85s">
        <h2 class="comments__title">Letters back</h2>
        <p class="comments__note">
          Replies open here soon &mdash; read and gently moderated, the way a
          mailbox should be. When they do: read each other&rsquo;s replies and
          answer one another &mdash; iron sharpens iron. Disagree kindly, and
          bring scripture, with context. Unkind one-liners won&rsquo;t be kept.
        </p>
        <p class="stub-note">Hosted comments connect here &mdash; approval queue, per-post toggle</p>
      </section>
${subscribe("Get the next letter", "Long, unhurried, and worth the sitting down. No noise, ever.")}

    </main>
${footerAndScripts.replace("__EXTRA_SCRIPTS__", "")}`;
}

// --- the envelope index --------------------------------------------------
function envelope(l) {
  return `        <li class="letter-item">
          <a class="envelope" href="letter-${l.slug}.html"
             aria-label="Open the letter: ${esc(l.title)} — ${l.monthYear}">
            <span class="envelope__sheet" aria-hidden="true"></span>
            <span class="envelope__flap" aria-hidden="true"></span>
            <span class="envelope__seal" aria-hidden="true">${esc(l.seal)}</span>
            <span class="envelope__addr">
              <span class="letter-date">${l.monthYear}</span>
              <span class="envelope__title">${esc(l.title)}</span>
              <span class="letter-excerpt">${esc(l.excerpt)}</span>
              <span class="envelope__open">Break the seal &amp; read</span>
            </span>
          </a>
        </li>`;
}

function lettersIndex() {
  const items = letters.map(envelope).join("\n\n");
  const empty = `<p class="page-lede reveal" style="--d:.8s">The first letter is on its way.</p>`;
  return `${head("The Letters — Yael's Letters", "Every letter, gathered in one quiet place — newest first.")}
<body>
  <div class="page">
${nav("letters")}
    <main class="inner">

      <p class="kicker reveal" style="--d:.3s">From the hill, newest first</p>
      <h1 class="page-title reveal" style="--d:.45s">The <em>Letters</em></h1>
      <p class="page-lede reveal" style="--d:.6s">
        Everything written so far, kept in one place. They are long on
        purpose, backed by hours in the Word &mdash; scripture given, with
        context, always. Begin anywhere.
      </p>

      <ol class="letter-list reveal" style="--d:.8s">
${letters.length ? items : empty}
      </ol>
${subscribe("Get the Letters", "One letter at a time, straight to you. No noise, ever.")}

    </main>
${footerAndScripts.replace("__EXTRA_SCRIPTS__", '<script src="assets/envelope.js" defer></script>')}`;
}

// --- RSS feed (drives the newsletter) ------------------------------------
function feed() {
  const items = letters.map((l) => `    <item>
      <title>${esc(l.title)}</title>
      <link>${SITE}/letter-${l.slug}.html</link>
      <guid isPermaLink="true">${SITE}/letter-${l.slug}.html</guid>
      <pubDate>${l.date.toUTCString()}</pubDate>
      <description>${esc(l.excerpt)}</description>
      <content:encoded><![CDATA[${l.bodyHtml}]]></content:encoded>
    </item>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Yael's Letters</title>
    <link>${SITE}/</link>
    <description>Turning believers back to a whole-Bible perspective — the amazing, beautiful Hebrew love story.</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;
}

// --- write everything ----------------------------------------------------
for (const l of letters) {
  writeFileSync(join(ROOT, `letter-${l.slug}.html`), letterPage(l));
}
writeFileSync(join(ROOT, "letters.html"), lettersIndex());
writeFileSync(join(ROOT, "feed.xml"), feed());

console.log(`Built ${letters.length} letter(s): ${letters.map((l) => l.slug).join(", ")}`);
console.log("Wrote letters.html and feed.xml");
