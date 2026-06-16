# Yael's Letters

A quiet home for the writing — gathered off Facebook into one place Yael owns.
Faith-and-farm letters, books, support, and a newsletter.

**Status:** Full static draft, awaiting first review. All sections from the
brief are built as pages with sample copy and clearly-marked integration
stubs (Decap blog, Gumroad/Payhip storefront, BMC/Stripe support, ESP
newsletter, hosted comments). The live site deploys from `main` via
GitHub Pages.

| Page | File |
|---|---|
| Hero + Subscribe | `index.html` |
| The Letters (index) | `letters.html` |
| A letter, opened (+ comments) | `letter-the-goat-ate-my-list.html` |
| Books | `books.html` |
| Support | `support.html` |
| About | `about.html` |

---

## The brief (locked)

| | |
|---|---|
| **Feeling** | Like a letter read by lamplight — the world goes quiet and someone is speaking only to you. |
| **Audience** | The return reader who already believes in her and wants a quiet place for the next letter. **Not for** the stranger who needs convincing. |
| **Hero object** | The letter-writing goat — vintage pen-and-ink (O. Herford reference). |
| **Job** | **Gather** — bring her flock into one owned home. |
| **Three-second memory** | A vintage goat writing a letter; it felt like opening a letter, not a website. |

### Style logics
- **Color** — *cream paper, green ink, gold seal.* Gold appears only on the action.
- **Type** — engraved display serif (Cormorant Garamond) for titles · book serif
  (EB Garamond) for reading · tiny tracked caps for the machinery · script only as a
  rare signature. No sans-serif.
- **Spatial** — one narrow centered column · generous paper margins · tall rhythm ·
  the goat centered in air · edges only for nav and the sign-off footer.

### Sections (cut survivors)
Hero · The Letters (blog) · Books · Support · Subscribe · short About ·
*moderated* Comments · sign-off footer.

### Planned integrations
- **Blog / CMS:** Decap (free, Git-based) — Yael self-publishes.
- **Comments:** hosted + moderated (approval queue), toggle per-post.
- **Books:** embedded digital storefront (Gumroad/Payhip) — Stripe payment +
  automatic ebook delivery for pre-sold buyers. Physical books linked separately.
- **Support:** Buy Me a Coffee + Stripe donations.
- **Newsletter:** ESP (Kit / Buttondown / Beehiiv).

---

## This proof

- `index.html` + `styles.css` — a self-contained hero page proving the whole brand
  world (paper, ink, gold seal, vintage serifs, lamplight, slow ink-fade motion,
  pen-stroke hover underlines, wax-seal CTA).
- The goat illustration in the plate is a **hand-drawn stand-in**. Yael's actual
  Herford-style art drops into `.plate` when her files arrive.

### Preview locally
Open `index.html` in any browser, or:
```
npx serve .
```

### Deploy (Vercel)
Static site — framework preset **"Other"**, no build step. Auto-deploys on push.

## How Yael runs the site (admin)

Everything lives behind one page: **`/desk.html`** — "Yael's Desk." One card per
job; most days she only taps **Write a Letter**.

### Writing letters (the content pipeline)
- Letters are markdown files in `content/letters/*.md` (front matter: `title`,
  `date`, `slug`, `excerpt`, `seal`, optional `title_html`, `draft`; body below).
- **`npm run build`** (`build/build.mjs`) regenerates `letter-<slug>.html`,
  `letters.html` (the envelope index) and `feed.xml` (RSS). The deploy workflow
  runs this automatically before publishing, so nothing is hand-coded.
- The editor is **Sveltia CMS** at **`/admin/`** (mobile-friendly Decap
  successor). Yael taps *New Letter*, types, hits *Publish* → it commits the
  markdown → the site rebuilds → the letter appears in its envelope.

### Newsletter — Resend, driven from this site
Everything Yael pushes is a letter, so one action covers site + email:
- **Sending:** the deploy runs `build/send-email.mjs` after the build. Any letter
  with **“Send to subscribers”** ticked is emailed once via a Resend **Broadcast**.
  Idempotent by broadcast name (`letter:<slug>`), so re-publishing/typo-fixes
  never re-send. Guarded by `RESEND_API_KEY` — normal builds without the secret
  send nothing.
- **Sign-ups:** the forms POST to a tiny Cloudflare **Worker**
  (`workers/subscribe-worker.js`) that adds the contact to the Resend audience
  (a static page can't safely hold the key). `assets/subscribe.js` handles the
  fetch + inline feedback. Books/merch are just letters that link to the store —
  no separate type needed.

### Setup to finish (one-time, needs the owner)
1. **Resend:** account → **verify sending domain** (DNS) → create an Audience +
   API key. See `workers/README.md`.
2. **Subscribe Worker:** deploy `workers/subscribe-worker.js` (Cloudflare, free)
   with `RESEND_API_KEY` + `RESEND_AUDIENCE_ID`; paste its URL into
   `assets/subscribe.js` → `ENDPOINT`.
3. **Repo secrets** (Settings → Secrets → Actions) for sending:
   `RESEND_API_KEY`, `RESEND_AUDIENCE_ID`, `RESEND_FROM`.
4. **CMS login (GitHub OAuth):** deploy `sveltia-cms-auth` (Cloudflare), create a
   GitHub OAuth app, set `base_url` in `admin/config.yml`; add Yael + the second
   admin as repo collaborators. (Until then `/admin/` loads but can't sign in.)

Comments / Donations / Books are managed in each provider's own dashboard; the
desk cards deep-link to them once chosen (Subscribers already points to Resend).

## Next step
Live on `main` (GitHub Pages, deploys on push). Remaining: finish Yael's login
(`SETUP-LOGIN.md`), wire the Ko-fi links when ready, and add a custom domain
when chosen (drop a `CNAME` + DNS — no code changes).
