# Yael's Letters

A quiet home for the writing — gathered off Facebook into one place Yael owns.
Faith-and-farm letters, books, support, and a newsletter.

**Status:** Full static draft, awaiting first review. All sections from the
brief are built as pages with sample copy and clearly-marked integration
stubs (Decap blog, Gumroad/Payhip storefront, BMC/Stripe support, ESP
newsletter, hosted comments). Live preview deploys from this branch via
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

### Auto-newsletter
`feed.xml` carries each letter's full content. Point the email service
(Kit / Buttondown / Beehiiv) at it as an **RSS broadcast** → publishing a
letter emails it to subscribers automatically. No second step.

### Two things to finish (one-time, needs the owner)
1. **CMS login (GitHub OAuth):** deploy the free `sveltia-cms-auth`
   Cloudflare Worker, create a GitHub OAuth app, then set `base_url` in
   `admin/config.yml` to the worker URL. Add Yael + the second admin as repo
   collaborators. (Until then `/admin/` loads but can't sign in.)
2. **Pick the email service** and paste its RSS-broadcast + signup-form details;
   the `<!-- ESP stub -->` forms and the Subscribers desk card get wired to it.

Service dashboards (Comments, Subscribers, Donations, Books) are managed in
each provider's own mobile app; the desk cards deep-link to them once chosen.

## Next step
Wire the integrations (comments, storefront, Stripe/BMC, ESP) and merge to
`main`, updating `admin/config.yml` `branch: main`.
