/* subscribe-worker — a tiny Cloudflare Worker that adds a newsletter sign-up
   to the Resend audience. The static site can't hold the API key, so this
   endpoint holds it and the site's form POSTs here.

   Anti-abuse (proportionate — no friction for real readers):
     • only accepts POST from the allowed site origin,
     • rejects a filled honeypot field,
     • optional Cloudflare Turnstile verification (set TURNSTILE_SECRET),
     • adds the contact WITHOUT sending an email, so the form can't be used to
       mail-bomb a victim's inbox.
   Pair with a Cloudflare Rate-Limiting rule on the route (see SECURITY.md).

   Env: RESEND_API_KEY, RESEND_AUDIENCE_ID (secrets); ALLOW_ORIGIN (var);
        TURNSTILE_SECRET (secret, optional). Deploy: see workers/README.md. */

export default {
  async fetch(request, env) {
    const allow = env.ALLOW_ORIGIN || "*";
    const cors = {
      "Access-Control-Allow-Origin": allow,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin",
    };

    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    if (request.method !== "POST") return json({ error: "Method not allowed" }, 405, cors);

    // Enforce origin server-side (CORS headers alone don't stop non-browser bots).
    if (allow !== "*") {
      const origin = request.headers.get("Origin") || "";
      if (origin && origin !== allow) return json({ error: "Forbidden" }, 403, cors);
    }

    // Guard against oversized bodies.
    if ((request.headers.get("Content-Length") | 0) > 2000) {
      return json({ error: "Too large" }, 413, cors);
    }

    let body;
    try { body = await request.json(); } catch { return json({ error: "Bad request" }, 400, cors); }

    // Honeypot: a real submission leaves this empty. Pretend success otherwise.
    if (body.website) return json({ ok: true }, 200, cors);

    const email = (body.email || "").trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 254) {
      return json({ error: "Please enter a valid email." }, 400, cors);
    }

    // Optional Turnstile check (only enforced when a secret is configured).
    if (env.TURNSTILE_SECRET) {
      const ok = await verifyTurnstile(env.TURNSTILE_SECRET, body.token, request);
      if (!ok) return json({ error: "Could not verify you're human." }, 403, cors);
    }

    // Add the contact, without sending anything (no mail-bomb vector).
    const r = await fetch(
      `https://api.resend.com/audiences/${env.RESEND_AUDIENCE_ID}/contacts`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ email, unsubscribed: false }),
      }
    );

    // 422 = already a contact → treat as success.
    if (r.ok || r.status === 422) return json({ ok: true }, 200, cors);
    return json({ error: "Could not subscribe right now." }, 502, cors);
  },
};

async function verifyTurnstile(secret, token, request) {
  if (!token) return false;
  const form = new FormData();
  form.append("secret", secret);
  form.append("response", token);
  const ip = request.headers.get("CF-Connecting-IP");
  if (ip) form.append("remoteip", ip);
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST", body: form,
    });
    const data = await res.json();
    return !!data.success;
  } catch { return false; }
}

function json(body, status, cors) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...cors },
  });
}
