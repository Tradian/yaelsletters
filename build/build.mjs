/* Build — turns content into the static site.

   Sources:
     content/series/*.md    a series (title, slug, description, seal, order)
     content/letters/*.md    a letter; optional `series` (slug) + `part` number

   Outputs:
     letter-<slug>.html      a reading page per letter (+ series context, prev/next)
     series-<slug>.html      a series page: its letters, in order
     letters.html            the index: standalone letters + series bundles
     feed.xml                RSS (drives the auto-newsletter)

   No framework. `npm run build`; CI runs it before deploy. */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { marked } from "marked";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LETTERS_DIR = join(ROOT, "content", "letters");
const SERIES_DIR = join(ROOT, "content", "series");
const SITE = "https://yaelsletters.com";

marked.setOptions({ mangle: false, headerIds: false });

/* Images in a letter become framed figures; the alt text becomes a caption.
   A title of "margin" / "margin-left" / "margin-right" floats it into the
   margin as marginalia — write  ![a little sketch](image.png "margin")  */
marked.use({
  renderer: {
    image(href, title, text) {
      const safe = esc(text || "");
      if (title === "margin" || title === "margin-left" || title === "margin-right") {
        const side = title === "margin-left" ? "left" : "right";
        return `<figure class="marginalia marginalia--${side}"><img src="${href}" alt="${safe}" loading="lazy" decoding="async"></figure>`;
      }
      const cap = text ? `<figcaption>${safe}</figcaption>` : "";
      return `<figure class="letterfig"><img src="${href}" alt="${safe}" loading="lazy" decoding="async">${cap}</figure>`;
    },
  },
});


const MONTHS = ["January","February","March","April","May","June","July",
  "August","September","October","November","December"];

const esc = (s = "") => s.replace(/&/g, "&amp;").replace(/</g, "&lt;")
  .replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function readDir(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith(".md"))
    .map((f) => ({ file: f, ...matter(readFileSync(join(dir, f), "utf8")) }));
}

// --- load series ---------------------------------------------------------
const series = readDir(SERIES_DIR).map(({ file, data }) => ({
  slug: data.slug || file.replace(/\.md$/, ""),
  title: data.title || "Untitled series",
  description: data.description || "",
  seal: (data.seal || "S").slice(0, 1),
  order: Number.isFinite(data.order) ? data.order : 0,
  letters: [],
}));
const seriesBySlug = Object.fromEntries(series.map((s) => [s.slug, s]));

// --- load letters --------------------------------------------------------
const letters = readDir(LETTERS_DIR).map(({ file, data, content }) => {
  const date = new Date(data.date);
  return {
    slug: data.slug || file.replace(/\.md$/, ""),
    title: data.title || "Untitled",
    titleHtml: data.title_html || esc(data.title || "Untitled"),
    excerpt: data.excerpt || "",
    sign: data.sign || "Yael",
    seal: (data.seal || "Y").slice(0, 1),
    draft: !!data.draft,
    series: data.series || null,
    part: Number.isFinite(data.part) ? data.part : null,
    date,
    monthYear: `${MONTHS[date.getMonth()]} ${date.getFullYear()}`,
    bodyHtml: marked.parse(content.trim()),
  };
})
.filter((l) => !l.draft)
.sort((a, b) => b.date - a.date);

// attach letters to their series (a missing/unknown series → standalone)
for (const l of letters) {
  const s = l.series && seriesBySlug[l.series];
  if (s) s.letters.push(l); else l.series = null;
}
for (const s of series) {
  s.letters.sort((a, b) => (a.part ?? 0) - (b.part ?? 0) || a.date - b.date);
  s.latest = s.letters.reduce((m, l) => (l.date > m ? l.date : m), new Date(0));
}
const standalone = letters.filter((l) => !l.series);

// --- shared chunks -------------------------------------------------------
// page: the output filename ("" for pages without a canonical URL yet);
// ogType: "article" for letters. Social cards fall back to the branded seal card.
const head = (title, desc, page = "", ogType = "website", img = `${SITE}/assets/og-card.jpg`) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="referrer" content="strict-origin-when-cross-origin" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; base-uri 'self'; object-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https:; form-action 'self' https:" />
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Pinyon+Script&display=swap" rel="stylesheet" />
  <link rel="alternate" type="application/rss+xml" title="Yael's Letters" href="feed.xml" />${page ? `
  <link rel="canonical" href="${SITE}/${page}" />
  <meta property="og:site_name" content="Yael's Letters" />
  <meta property="og:type" content="${ogType}" />
  <meta property="og:url" content="${SITE}/${page}" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(desc)}" />
  <meta property="og:image" content="${img}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(title)}" />
  <meta name="twitter:description" content="${esc(desc)}" />
  <meta name="twitter:image" content="${img}" />` : ""}
  <meta name="theme-color" content="#f1e9d2" />
  <link rel="icon" type="image/svg+xml" href="assets/favicon.svg" />
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
        <form class="subscribe__form" action="#" method="post">
          <label class="visually-hidden" for="email">Email address</label>
          <input id="email" type="email" name="email" placeholder="your@email.com" required />
          <input class="hp-field" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" />
          <button class="seal-btn" type="submit">Subscribe</button>
        </form>
        <p class="subscribe__fineprint">No spam, ever &mdash; unsubscribe anytime. By subscribing you agree to the <a href="privacy.html">Privacy&nbsp;Policy</a>.</p>
      </section>`;

const tail = (extra = "") => `
    <footer class="signoff">
      <p class="signoff__line">Until the next letter,</p>
      <p class="signoff__meta">Yael&rsquo;s Letters &middot; YHWH bless you</p>
      <p class="signoff__legal"><a href="privacy.html">Privacy</a> &middot; <a href="terms.html">Terms</a></p>
    </footer>

  </div>

  <!-- Atelier: ink becomes light -->
  <canvas id="paper-layer" aria-hidden="true"></canvas>
  <canvas id="ink-layer" aria-hidden="true"></canvas>
  <canvas id="light-layer" aria-hidden="true"></canvas>
  <script src="assets/paper.js" defer></script>
  <script src="assets/ink-light.js" defer></script>
  <script src="assets/subscribe.js" defer></script>
  ${extra}
</body>
</html>`;

// an envelope on an index/series page; dateLabel is whatever sits up top
function envelope(l, dateLabel) {
  return `        <li class="letter-item">
          <a class="letter-card" href="letter-${l.slug}.html"
             aria-label="Open the letter: ${esc(l.title)} — ${esc(dateLabel)}">
            <span class="letter-card__bloom" aria-hidden="true"></span>
            <span class="letter-card__seal" aria-hidden="true">${esc(l.seal)}</span>
            <span class="letter-date">${esc(dateLabel)}</span>
            <span class="letter-card__title">${esc(l.title)}</span>
            <span class="letter-excerpt">${esc(l.excerpt)}</span>
            <span class="letter-card__open">Break the seal &amp; read</span>
          </a>
        </li>`;
}

// a series shown on the index as a stacked bundle
function seriesCard(s) {
  const n = s.letters.length;
  return `        <li class="letter-item">
          <a class="series-card" href="series-${s.slug}.html"
             aria-label="Open the series: ${esc(s.title)} — ${n} letter${n===1?"":"s"}">
            <span class="series-card__kicker">A series &middot; ${n} letter${n===1?"":"s"}</span>
            <span class="series-card__title">${esc(s.title)}</span>
            <span class="series-card__desc">${esc(s.description)}</span>
            <span class="envelope__open">Open the series</span>
          </a>
        </li>`;
}

// --- a reading page ------------------------------------------------------
function letterPage(l) {
  const s = l.series ? seriesBySlug[l.series] : null;
  let kicker, tag = "", partnav = "";
  if (s) {
    const idx = s.letters.indexOf(l);
    const prev = s.letters[idx - 1], next = s.letters[idx + 1];
    kicker = `${esc(s.title)} &middot; Part ${l.part ?? idx + 1} &middot; ${l.monthYear}`;
    tag = `      <a class="letter-series-tag reveal" style="--d:.25s" href="series-${s.slug}.html">&larr; ${esc(s.title)}</a>\n`;
    partnav = `
      <nav class="partnav reveal" style="--d:1.1s" aria-label="Series navigation">
        ${prev ? `<a class="partnav__link partnav__prev" href="letter-${prev.slug}.html"><span class="partnav__dir">&larr; Previous</span><span class="partnav__name">${esc(prev.title)}</span></a>` : `<span class="partnav__link is-empty"></span>`}
        ${next ? `<a class="partnav__link partnav__next" href="letter-${next.slug}.html"><span class="partnav__dir">Next &rarr;</span><span class="partnav__name">${esc(next.title)}</span></a>` : `<span class="partnav__link is-empty"></span>`}
      </nav>`;
  } else {
    kicker = `A letter &middot; ${l.monthYear}`;
  }
  return `${head(`${l.title} — Yael's Letters`, l.excerpt, `letter-${l.slug}.html`, "article")}
<body>
  <div class="page">
${nav("letters")}
    <main class="inner">

${tag}      <p class="kicker reveal" style="--d:.3s">${kicker}</p>
      <h1 class="page-title reveal" style="--d:.45s">${l.titleHtml}</h1>

      <article class="letterbody reveal" style="--d:.65s">
        ${l.bodyHtml.trim()}
        <p class="signature">&mdash; ${esc(l.sign)}</p>
      </article>
${partnav}
      <section class="comments reveal" style="--d:.9s">
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
${tail()}`;
}

// --- a series page -------------------------------------------------------
function seriesPage(s) {
  const items = s.letters.map((l) => envelope(l, `Part ${l.part ?? s.letters.indexOf(l) + 1} &middot; ${l.monthYear}`)).join("\n\n");
  const empty = `<p class="page-lede reveal" style="--d:.8s">The first letter in this series is on its way.</p>`;
  return `${head(`${s.title} — Yael's Letters`, s.description, `series-${s.slug}.html`)}
<body>
  <div class="page">
${nav("letters")}
    <main class="inner">

      <a class="letter-series-tag reveal" style="--d:.25s" href="letters.html">&larr; All the Letters</a>
      <p class="kicker reveal" style="--d:.3s">A series &middot; ${s.letters.length} letter${s.letters.length===1?"":"s"}</p>
      <h1 class="page-title reveal" style="--d:.45s">${esc(s.title)}</h1>
      <p class="page-lede reveal" style="--d:.6s">${esc(s.description)}</p>

      <ol class="letter-list reveal" style="--d:.8s">
${s.letters.length ? items : empty}
      </ol>
${subscribe("Follow the series", "Each part comes to you as it's written. No noise, ever.")}

    </main>
${tail('<script src="assets/envelope.js" defer></script>')}`;
}

// --- the index: standalone letters + series bundles, newest first --------
function lettersIndex() {
  const entries = [
    ...standalone.map((l) => ({ date: l.date, html: envelope(l, l.monthYear) })),
    ...series.map((s) => ({ date: s.latest, order: s.order, html: seriesCard(s) })),
  ].sort((a, b) => b.date - a.date);
  const list = entries.map((e) => e.html).join("\n\n");
  const empty = `<p class="page-lede reveal" style="--d:.8s">The first letter is on its way.</p>`;
  return `${head("The Letters — Yael's Letters", "Every letter, gathered in one quiet place — newest first.", "letters.html")}
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
${entries.length ? list : empty}
      </ol>
${subscribe("Get the Letters", "One letter at a time, straight to you. No noise, ever.")}

    </main>
${tail('<script src="assets/envelope.js" defer></script>')}`;
}

// --- RSS feed ------------------------------------------------------------
function feed() {
  const items = letters.map((l) => {
    const s = l.series ? seriesBySlug[l.series] : null;
    const title = s ? `${s.title}: ${l.title}` : l.title;
    return `    <item>
      <title>${esc(title)}</title>
      <link>${SITE}/letter-${l.slug}.html</link>
      <guid isPermaLink="true">${SITE}/letter-${l.slug}.html</guid>
      <pubDate>${l.date.toUTCString()}</pubDate>
      <description>${esc(l.excerpt)}</description>
      <content:encoded><![CDATA[${l.bodyHtml}]]></content:encoded>
    </item>`;
  }).join("\n");
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


// --- editable pages & books (content/pages/*.md, content/books/*.md) -------
// Yael edits these from /admin/ (Pages + Books collections); the build renders
// them into the real pages. Buy/donate links: live when a URL exists, a quiet
// "soon" state until then.
const PAGES_DIR = join(ROOT, "content", "pages");
const BOOKS_DIR = join(ROOT, "content", "books");

function pageData(name) {
  const f = join(PAGES_DIR, name + ".md");
  if (!existsSync(f)) return null;
  const { data, content } = matter(readFileSync(f, "utf8"));
  return { ...data, bodyHtml: marked.parse((content || "").trim()) };
}

const books = readDir(BOOKS_DIR).map(({ file, data, content }) => ({
  slug: data.slug || file.replace(/\.md$/, ""),
  title: data.title || "Untitled",
  kicker: data.kicker || "",
  status: data.status || "Out now",
  author: data.author || "Yael",
  coverTitle: String(data.cover_title || data.title || "").split("\n").map(esc).join("<br/>"),
  spineTitle: data.spine_title || data.title || "",
  shelfNote: data.shelf_note || "",
  blurb: data.blurb || "",
  amazon: data.amazon || "",
  pdf: data.pdf || "",
  freeNote: data.free_note || "",
  closing: data.closing || "",
  published: data.published !== false,
  order: Number.isFinite(data.order) ? data.order : 0,
  bodyHtml: marked.parse((content || "").trim()),
})).filter((b) => b.published).sort((a, b) => a.order - b.order);

const buyLink = (href, cls, label) => href
  ? `<a class="${cls}" href="${esc(href)}" target="_blank" rel="noopener">${label}</a>`
  : `<a class="${cls} is-soon" aria-disabled="true" title="Available soon">${label}</a>`;

function bookPage(b) {
  const cover = `assets/covers/${b.slug}.jpg`;
  return `${head(`${b.title} — Yael's Letters`, b.blurb, `book-${b.slug}.html`, "book", `${SITE}/${cover}`)}
<body>
  <div class="page">
${nav("books")}
    <main class="inner">

      <a class="book-back reveal" style="--d:.25s" href="books.html">&larr; Back to the shelf</a>

      <div class="book-hero reveal" style="--d:.4s">
        <div class="book-cover" data-cover="${cover}" data-cover-alt="Cover — ${esc(b.title)}">
          <p class="book-cover__kicker">${esc(b.kicker)}</p>
          <h1 class="book-cover__title">${b.coverTitle}</h1>
          <span class="book-cover__rule"></span>
          <p class="book-cover__author">${esc(b.author)}</p>
        </div>
        <div class="book-hero__info">
          <p class="book-hero__kicker">${esc(b.status)}</p>
          <p class="book-hero__title">${esc(b.title)}</p>
          <p class="book-hero__author">by ${esc(b.author)}</p>
          <p class="book-hero__about">${esc(b.blurb)}</p>
          <div class="actions">
            ${buyLink(b.amazon, "seal-btn", "Get the print edition")}
            ${buyLink(b.pdf, "penlink", "Read the free PDF")}
          </div>
          ${b.freeNote ? `<p class="book-hero__free">${esc(b.freeNote)}</p>` : ""}
        </div>
      </div>

      <section class="preview reveal" style="--d:.6s">
        <p class="preview__label">About this book</p>
        <article class="leaf">
${b.bodyHtml}
        </article>
        ${b.closing ? `<p class="preview__close">${esc(b.closing)}</p>` : ""}
      </section>
${subscribe("Hear when the next book is ready", "Another is already underway. Subscribers always know first.")}
    </main>
${tail(`<script src="assets/cover.js" defer></script>`)}`;
}

function booksIndex() {
  const pg = pageData("books") || {};
  const vols = books.map((b, i) => `
        <article class="book3d ${i % 2 === 0 ? "book3d--cloth" : "book3d--cream"}">
          <a class="book3d__link" href="book-${b.slug}.html" aria-label="Open: ${esc(b.title)}">
            <span class="book3d__case">
              <span class="book3d__face book3d__back" aria-hidden="true"></span>
              <span class="book3d__face book3d__pages" aria-hidden="true"></span>
              <span class="book3d__face book3d__spine" aria-hidden="true">
                <span class="spine-title">${esc(b.spineTitle)}</span>
                <span class="spine-seal">Y</span>
              </span>
              <span class="book3d__face book3d__front" data-cover="assets/covers/${b.slug}.jpg">
                <span class="cover-kicker">${esc(b.kicker)}</span>
                <span class="cover-title">${b.coverTitle}</span>
                <span class="cover-rule"></span>
                <span class="cover-author">${esc(b.author)}</span>
                <span class="cover-sheen" aria-hidden="true"></span>
              </span>
            </span>
          </a>
          <span class="book3d__shadow" aria-hidden="true"></span>
          <p class="book3d__caption">${esc(b.title)} <span>${esc(b.shelfNote)} &rarr;</span></p>
        </article>`).join("\n");

  const coming = pg.show_coming_soon === false ? "" : `
        <article class="book3d ${books.length % 2 === 0 ? "book3d--cloth" : "book3d--cream"}">
          <span class="book3d__link" aria-label="Another book — coming soon">
            <span class="book3d__case">
              <span class="book3d__face book3d__back" aria-hidden="true"></span>
              <span class="book3d__face book3d__pages" aria-hidden="true"></span>
              <span class="book3d__face book3d__spine" aria-hidden="true">
                <span class="spine-title">Coming soon</span>
                <span class="spine-seal">Y</span>
              </span>
              <span class="book3d__face book3d__front">
                <span class="cover-kicker">The next one</span>
                <span class="cover-title">Coming<br/>soon</span>
                <span class="cover-rule"></span>
                <span class="cover-author">Yael</span>
                <span class="cover-sheen" aria-hidden="true"></span>
              </span>
            </span>
          </span>
          <span class="book3d__shadow" aria-hidden="true"></span>
          <p class="book3d__caption">${esc(pg.coming_caption || "More on the way")} <span>${esc(pg.coming_note || "another book — soon")}</span></p>
        </article>`;

  return `${head("Books — Yael's Letters", pg.lede || "Yael's books — bound and kept.", "books.html")}
<body>
  <div class="page">
${nav("books")}
    <main class="inner">

      <p class="kicker reveal" style="--d:.3s">${esc(pg.kicker || "Bound and kept")}</p>
      <h1 class="page-title reveal" style="--d:.45s">${pg.title_html || "The <em>Books</em>"}</h1>
      <p class="page-lede reveal" style="--d:.6s">${esc(pg.lede || "")}</p>

      <div class="bookcase reveal" style="--d:.8s">
${vols}
${coming}
      </div>
      <p class="bookcase__hint reveal" style="--d:.9s">Turn a book in your hand</p>
${subscribe(esc(pg.subscribe_title || "Hear when a new book is ready"), esc(pg.subscribe_note || "Subscribers always know first."))}
    </main>
${tail(`<script src="assets/books3d.js" defer></script>`)}`;
}

function aboutPage() {
  const pg = pageData("about");
  if (!pg) return null;
  return `${head("About — Yael's Letters", pg.lede || "", "about.html")}
<body>
  <div class="page">
${nav("about")}
    <main class="inner">

      <p class="kicker reveal" style="--d:.3s">${esc(pg.kicker || "A short introduction")}</p>
      <h1 class="page-title reveal" style="--d:.45s">${pg.title_html || "About <em>Yael</em>"}</h1>
      <p class="page-lede reveal" style="--d:.55s">${esc(pg.lede || "")}</p>

      <figure class="plate reveal" style="--d:.65s">
        <img class="plate__art" src="assets/goat.jpg"
             alt="A goat seated on a hill, writing a letter with a quill pen — an Oliver Herford illustration"
             width="275" height="324" />
        <figcaption class="plate__caption">${esc(pg.caption || "")}</figcaption>
      </figure>

      <article class="letterbody reveal" style="--d:.8s">
${pg.bodyHtml}
        <p class="signature">&mdash; Yael</p>
      </article>
${subscribe(esc(pg.subscribe_title || "Get the Letters"), esc(pg.subscribe_note || "One letter at a time, straight to you."))}
    </main>
${tail()}`;
}

function supportPage() {
  const pg = pageData("support");
  if (!pg) return null;
  const ways = (pg.ways || []).map((w) => `        <li>${esc(w)}</li>`).join("\n");
  const kofiBtn = pg.kofi
    ? `<a class="seal-btn" href="${esc(pg.kofi)}" target="_blank" rel="noopener">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 5h11a3.5 3.5 0 010 7h-1M5 5v7a4 4 0 004 4h3a4 4 0 004-4" stroke="#fbf4df" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M7 2.4v1.4M10 2.4v1.4M13 2.4v1.4" stroke="#fbf4df" stroke-width="1.4" stroke-linecap="round"/>
          </svg>
          Support on Ko-fi</a>`
    : `<a class="seal-btn is-soon" aria-disabled="true" title="Available soon">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 5h11a3.5 3.5 0 010 7h-1M5 5v7a4 4 0 004 4h3a4 4 0 004-4" stroke="#fbf4df" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M7 2.4v1.4M10 2.4v1.4M13 2.4v1.4" stroke="#fbf4df" stroke-width="1.4" stroke-linecap="round"/>
          </svg>
          Support on Ko-fi</a>`;
  const stripeLink = pg.stripe
    ? `<a class="penlink" href="${esc(pg.stripe)}" target="_blank" rel="noopener">Give another way</a>`
    : `<a class="penlink is-soon" aria-disabled="true" title="Available soon">Give another way</a>`;
  return `${head("Support — Yael's Letters", "Keep the lamp lit — ways to support the letters from the farm.", "support.html")}
<body>
  <div class="page">
${nav("support")}
    <main class="inner">

      <p class="kicker reveal" style="--d:.3s">${esc(pg.kicker || "Keep the lamp lit")}</p>
      <h1 class="page-title reveal" style="--d:.45s">${pg.title_html || "Support the <em>Letters</em>"}</h1>

      <article class="letterbody reveal" style="--d:.6s">
${pg.bodyHtml}
        <p class="signature">&mdash; Yael</p>
      </article>

      <div class="actions reveal" style="--d:.8s">
        ${kofiBtn}
        ${stripeLink}
      </div>
${pg.kofi ? "" : `      <p class="stub-note reveal" style="--d:.85s">Donations connect here soon</p>\n`}
      <ul class="ways reveal" style="--d:.95s">
${ways}
      </ul>
${subscribe(esc(pg.subscribe_title || "The simplest support is reading"), esc(pg.subscribe_note || "Get each letter as it's written. Free, always."))}
    </main>
${tail()}`;
}

// --- write everything ----------------------------------------------------
if (!existsSync(SERIES_DIR)) mkdirSync(SERIES_DIR, { recursive: true });
for (const l of letters) writeFileSync(join(ROOT, `letter-${l.slug}.html`), letterPage(l));
for (const s of series) writeFileSync(join(ROOT, `series-${s.slug}.html`), seriesPage(s));
writeFileSync(join(ROOT, "letters.html"), lettersIndex());
writeFileSync(join(ROOT, "feed.xml"), feed());
for (const b of books) writeFileSync(join(ROOT, `book-${b.slug}.html`), bookPage(b));
writeFileSync(join(ROOT, "books.html"), booksIndex());
const _about = aboutPage(); if (_about) writeFileSync(join(ROOT, "about.html"), _about);
const _support = supportPage(); if (_support) writeFileSync(join(ROOT, "support.html"), _support);

// --- sitemap ---------------------------------------------------------------
const staticPages = ["", "letters.html", "books.html",
  "support.html", "about.html", "privacy.html", "terms.html"];
const urls = [
  ...staticPages.map((p) => `${SITE}/${p}`),
  ...letters.map((l) => `${SITE}/letter-${l.slug}.html`),
  ...series.map((sr) => `${SITE}/series-${sr.slug}.html`),
  ...books.map((b) => `${SITE}/book-${b.slug}.html`),
];
writeFileSync(join(ROOT, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls.map((u) => `  <url><loc>${u}</loc></url>`).join("\n") + `\n</urlset>\n`);

console.log(`Built ${letters.length} letter(s), ${series.length} series.`);
console.log(`  standalone: ${standalone.map((l) => l.slug).join(", ") || "(none)"}`);
for (const s of series) console.log(`  series ${s.slug}: ${s.letters.map((l) => l.slug).join(", ") || "(empty)"}`);
