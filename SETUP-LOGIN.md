# Giving Yael her own login (one-time, ~20 min)

Yael's editor already exists at **`/admin/`** (and **Yael's Desk → Letters & Series**).
It loads today, but can't sign in yet because it needs a small, free **login
gateway**. This is the standard, secure setup for a Git-based CMS: the website
stays a plain static site (no password to leak), and publishing happens through
GitHub via a tiny OAuth proxy.

There are **three owner-only steps** (they need your GitHub + a free Cloudflare
account — I can't create those for you). When they're done, send me the worker
URL and I'll flip the one switch in `admin/config.yml`.

---

## 1. Create a GitHub OAuth app  (2 min)
GitHub → **Settings → Developer settings → OAuth Apps → New OAuth App**
- **Application name:** Yael's Letters Editor
- **Homepage URL:** the live site (e.g. `https://yaelsletters.com`
  or your custom domain once chosen)
- **Authorization callback URL:** `https://<your-worker>.workers.dev/callback`
  (you'll get the exact worker URL in step 2 — you can edit this field after)
- Register, then **copy the Client ID** and **generate a Client Secret**. Keep
  the secret private — it goes in Cloudflare, never in the repo.

## 2. Deploy the login gateway  (10 min)
Use the maintained, open-source **`sveltia-cms-auth`** Cloudflare Worker (built
for this exact CMS):
- Create a free **Cloudflare** account → Workers.
- Deploy `sveltia-cms-auth` (its repo has a one-click deploy / `wrangler` steps).
- Set its environment variables:
  - `GITHUB_CLIENT_ID` = from step 1
  - `GITHUB_CLIENT_SECRET` = from step 1
  - `ALLOWED_DOMAINS` = your site domain (e.g. `tradian.github.io` or the custom one)
- Note the worker's URL — it looks like `https://yaels-auth.<you>.workers.dev`.
- Back in the GitHub OAuth app (step 1), set the **callback URL** to
  `https://yaels-auth.<you>.workers.dev/callback`.

## 3. Add Yael as an editor  (1 min)
Repo → **Settings → Collaborators → Add people** → invite Yael's GitHub account.
(That's what lets her save and publish.)

---

## Then I flip one switch (send me the worker URL)
In `admin/config.yml` I set:
```yaml
backend:
  name: github
  repo: Tradian/yaelsletters
  branch: main                         # once we go live on main (below)
  base_url: https://yaels-auth.<you>.workers.dev   # ← your worker from step 2
```
After that, Yael visits **`/admin/`** (or the **Letters & Series** card on her
Desk), clicks **Login with GitHub**, and she's writing — text, images, and
marginalia — with **Publish** rebuilding the site and emailing subscribers.

## Going live on the real address
Right now the site previews from the working branch. To make it Yael's everyday
site we:
1. Merge this branch into **`main`**, and point GitHub Pages at `main`.
2. (Optional) add a **custom domain** (e.g. `yaelsletters.com`) — a `CNAME` file
   + your DNS; I'll prep it once you pick the domain.
3. Set `branch: main` in `admin/config.yml` so Yael edits the live site.

Tell me which address you want (the free `…github.io` one, or a custom domain)
and I'll prepare the merge + config so it all points the same way.

## How Yael adds images & marginalia (for her)
In the editor, use the image button to drop a picture into a letter — it appears
as a **framed plate with a caption** (the caption is the image's description).
To tuck a little sketch into the **margin**, add the word `margin` after it:
`![a small sketch](image.png "margin")`. Send the images along and I'll place the
first few so the pattern's clear.
