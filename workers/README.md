# Subscribe Worker — deploy notes

A tiny Cloudflare Worker that receives newsletter sign-ups from the site's form
and adds them to the Resend audience. Free tier is far more than enough.

## One-time setup
1. **Resend** → create an account, **verify your sending domain** (DNS records),
   and create an **Audience**. Note the Audience ID and create an **API key**.
2. **Cloudflare** → install Wrangler and deploy this worker:
   ```bash
   npm i -g wrangler
   wrangler login
   # from the repo root:
   wrangler deploy workers/subscribe-worker.js --name yael-subscribe
   wrangler secret put RESEND_API_KEY      --name yael-subscribe   # paste the key
   wrangler secret put RESEND_AUDIENCE_ID  --name yael-subscribe   # paste the audience id
   # optional: lock CORS to the site
   wrangler deploy workers/subscribe-worker.js --name yael-subscribe \
     --var ALLOW_ORIGIN:https://tradian.github.io
   ```
3. Copy the deployed URL (e.g. `https://yael-subscribe.<account>.workers.dev`)
   into **`assets/subscribe.js`** → `ENDPOINT`.

## Sending letters (no worker needed)
The newsletter *send* runs in the GitHub Actions deploy, not here. Add these as
**repo secrets** (Settings → Secrets → Actions):
- `RESEND_API_KEY`
- `RESEND_AUDIENCE_ID`
- `RESEND_FROM`  — e.g. `Yael's Letters <letters@yourdomain>`

Then any letter published with **“Send to subscribers”** ticked is emailed once.
