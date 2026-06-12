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
const SITE = "https://tradian.github.io/yaelsletters";

marked.setOptions({ mangle: false, headerIds: false });

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
        <form class="subscribe__form" action="#" method="post">
          <label class="visually-hidden" for="email">Email address</label>
          <input id="email" type="email" name="email" placeholder="your@email.com" required />
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
          <a class="envelope" href="letter-${l.slug}.html"
             aria-label="Open the letter: ${esc(l.title)} — ${esc(dateLabel)}">
            <span class="envelope__sheet" aria-hidden="true"></span>
            <span class="envelope__flap" aria-hidden="true"></span>
            <span class="envelope__seal" aria-hidden="true">${esc(l.seal)}</span>
            <span class="envelope__addr">
              <span class="letter-date">${esc(dateLabel)}</span>
              <span class="envelope__title">${esc(l.title)}</span>
              <span class="letter-excerpt">${esc(l.excerpt)}</span>
              <span class="envelope__open">Break the seal &amp; read</span>
            </span>
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
  return `${head(`${l.title} — Yael's Letters`, l.excerpt)}
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
  return `${head(`${s.title} — Yael's Letters`, s.description)}
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

// --- write everything ----------------------------------------------------
if (!existsSync(SERIES_DIR)) mkdirSync(SERIES_DIR, { recursive: true });
for (const l of letters) writeFileSync(join(ROOT, `letter-${l.slug}.html`), letterPage(l));
for (const s of series) writeFileSync(join(ROOT, `series-${s.slug}.html`), seriesPage(s));
writeFileSync(join(ROOT, "letters.html"), lettersIndex());
writeFileSync(join(ROOT, "feed.xml"), feed());

console.log(`Built ${letters.length} letter(s), ${series.length} series.`);
console.log(`  standalone: ${standalone.map((l) => l.slug).join(", ") || "(none)"}`);
for (const s of series) console.log(`  series ${s.slug}: ${s.letters.map((l) => l.slug).join(", ") || "(empty)"}`);
