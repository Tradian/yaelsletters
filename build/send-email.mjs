/* send-email — emails newly-published letters to subscribers via Resend.

   Runs in CI after the build. For each letter whose front matter has
   `email_send: true`, it creates a Resend Broadcast to the audience and sends
   it — once. Idempotency is by broadcast name (`letter:<slug>`): if a broadcast
   with that name already exists, it is skipped, so re-publishing or fixing a
   typo never re-sends.

   No-ops safely (exit 0) when the Resend env vars are absent, so normal builds
   are unaffected. Required env:
     RESEND_API_KEY        your Resend API key
     RESEND_AUDIENCE_ID    the audience (contact list) to send to
     RESEND_FROM           e.g. "Yael's Letters <letters@yourdomain>"
   Optional:
     SITE_URL              defaults to the GitHub Pages URL
*/

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { marked } from "marked";

const KEY = process.env.RESEND_API_KEY;
const AUDIENCE = process.env.RESEND_AUDIENCE_ID;
const FROM = process.env.RESEND_FROM;
const SITE = process.env.SITE_URL || "https://tradian.github.io/yaelsletters";

if (!KEY || !AUDIENCE || !FROM) {
  console.log("send-email: Resend env not set — skipping (no email sent).");
  process.exit(0);
}

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LETTERS_DIR = join(ROOT, "content", "letters");
const SERIES_DIR = join(ROOT, "content", "series");

const api = (path, opts = {}) =>
  fetch("https://api.resend.com" + path, {
    ...opts,
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json", ...(opts.headers || {}) },
  });

function seriesTitle(slug) {
  if (!slug || !existsSync(SERIES_DIR)) return null;
  for (const f of readdirSync(SERIES_DIR).filter((x) => x.endsWith(".md"))) {
    const { data } = matter(readFileSync(join(SERIES_DIR, f), "utf8"));
    if ((data.slug || f.replace(/\.md$/, "")) === slug) return data.title || null;
  }
  return null;
}

function emailHtml(letter, bodyHtml) {
  const url = `${SITE}/letter-${letter.slug}.html`;
  return `<!DOCTYPE html><html><body style="margin:0;background:#f1e9d2;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1e9d2;">
    <tr><td align="center" style="padding:28px 16px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fffdf2;border:1px solid #2f4538;">
        <tr><td style="padding:32px 36px;font-family:Georgia,'Times New Roman',serif;color:#1b291f;">
          <p style="text-transform:uppercase;letter-spacing:3px;font-size:11px;color:#5d6f60;margin:0 0 14px;">Yael&rsquo;s Letters</p>
          <h1 style="font-size:26px;line-height:1.2;margin:0 0 18px;color:#1b291f;">${letter.title}</h1>
          <div style="font-size:17px;line-height:1.7;color:#2f4538;">${bodyHtml}</div>
          <p style="font-family:'Brush Script MT',cursive;font-size:22px;margin:18px 0 0;color:#2f4538;">&mdash; Yael</p>
          <p style="margin:26px 0 0;"><a href="${url}" style="color:#8a6220;">Read it on the web &rarr;</a></p>
        </td></tr>
      </table>
      <p style="font-family:Georgia,serif;font-size:12px;color:#5d6f60;margin:18px 0 0;">
        YHWH bless you. &middot; <a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#5d6f60;">Unsubscribe</a>
      </p>
    </td></tr>
  </table>
</body></html>`;
}

async function existingNames() {
  const r = await api("/broadcasts");
  if (!r.ok) return new Set();
  const j = await r.json().catch(() => ({}));
  return new Set((j.data || []).map((b) => b.name).filter(Boolean));
}

const files = existsSync(LETTERS_DIR)
  ? readdirSync(LETTERS_DIR).filter((f) => f.endsWith(".md")) : [];
const toSend = files
  .map((f) => ({ f, ...matter(readFileSync(join(LETTERS_DIR, f), "utf8")) }))
  .filter((x) => x.data.email_send === true && !x.data.draft)
  .map((x) => ({
    slug: x.data.slug || x.f.replace(/\.md$/, ""),
    title: x.data.title || "A new letter",
    series: x.data.series || null,
    excerpt: x.data.excerpt || "",
    bodyHtml: marked.parse((x.content || "").trim()),
  }));

if (!toSend.length) {
  console.log("send-email: no letters marked email_send — nothing to send.");
  process.exit(0);
}

const sentNames = await existingNames();
let sent = 0;

for (const letter of toSend) {
  const name = `letter:${letter.slug}`;
  if (sentNames.has(name)) {
    console.log(`send-email: '${letter.slug}' already broadcast — skipping.`);
    continue;
  }
  const st = seriesTitle(letter.series);
  const subject = st ? `${st}: ${letter.title}` : letter.title;

  const create = await api("/broadcasts", {
    method: "POST",
    body: JSON.stringify({
      audience_id: AUDIENCE, from: FROM, name, subject,
      html: emailHtml(letter, letter.bodyHtml),
    }),
  });
  if (!create.ok) {
    console.error(`send-email: create failed for '${letter.slug}':`, create.status, await create.text());
    process.exitCode = 1;
    continue;
  }
  const { id } = await create.json();
  const send = await api(`/broadcasts/${id}/send`, { method: "POST", body: "{}" });
  if (!send.ok) {
    console.error(`send-email: send failed for '${letter.slug}':`, send.status, await send.text());
    process.exitCode = 1;
    continue;
  }
  console.log(`send-email: sent '${letter.slug}' → broadcast ${id}`);
  sent++;
}

console.log(`send-email: done. ${sent} letter(s) sent.`);
