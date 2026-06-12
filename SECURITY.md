# Security overview

Yael's Letters is a **static publication** with a deliberately small attack
surface: there is no application server or database to exploit, the pages are
plain HTML/CSS/JS served from GitHub Pages, and the only dynamic endpoint is a
tiny newsletter sign-up Worker. Security is layered to be effective without
getting in a real reader's way.

## What's protected in this repo (already in place)

**Site**
- Static hosting — nothing server-side to compromise; content is versioned in Git.
- **Content-Security-Policy** (meta) limits scripts to same-origin and blocks
  `object`/`base` injection; **Referrer-Policy** is `strict-origin-when-cross-origin`.
- **No cookies, no analytics, no third-party trackers.**
- Dependencies pinned (Sveltia major version); CI installs via `npm ci` (lockfile).
- Secrets are **never committed** — they live in Cloudflare/GitHub secret stores;
  the email-send CI step is guarded and no-ops without them.

**Sign-up endpoint** (`workers/subscribe-worker.js`)
- Server-side **origin enforcement** (not just CORS).
- **Honeypot** field — bots that fill it are silently dropped.
- Optional **Cloudflare Turnstile** (invisible bot check) — on when configured.
- Adds the contact **without sending an email**, so the form can't be used to
  mail-bomb a victim's inbox.
- Strict email validation + request-size guard.

## Recommended infra hardening (owner — one-time, proportionate)

1. **Front the site with Cloudflare** (custom domain, free plan). This is the
   biggest win and enables what GitHub Pages can't:
   - **Real security response headers**: enforce the CSP as a header (incl.
     `frame-ancestors 'none'` for clickjacking), `Strict-Transport-Security`,
     `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`.
   - **WAF managed rules** + **Bot Fight Mode** (DDoS/bot mitigation).
   - **Rate-Limiting rule** on the subscribe Worker route (e.g. 5 requests/min/IP).
2. **Turn on Turnstile** (free) for the sign-up form: create a widget, put the
   site key in `assets/subscribe.js` (`TURNSTILE_SITEKEY`) and the secret in the
   Worker (`TURNSTILE_SECRET`).
3. **Email anti-spoofing**: when verifying the Resend sending domain, confirm
   **SPF + DKIM**, and add a **DMARC** record (start `p=none`, then tighten to
   `quarantine`/`reject`). This stops others spoofing the domain.
4. **Account hardening**: enable **2FA** on GitHub, Cloudflare, and Resend; use
   least-privilege API tokens; rotate keys periodically.
5. **Repo hardening**: branch protection on the deploy branch; restrict who can
   change workflows; keep collaborators to the two admins.
6. **Comments**: choose a provider with built-in spam filtering + a moderation
   queue (already the plan); enable per-post.
7. **Backups**: content is in Git; export the Resend audience periodically.

## Reporting

Found something? Email **ian@ourfellowbrands.com**. Please don't open a public
issue for a security report.
