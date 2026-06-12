/* subscribe-worker — a tiny Cloudflare Worker that adds a newsletter sign-up
   to the Resend audience. The static site can't hold the API key, so this
   endpoint holds it and the site's form POSTs here.

   Deploy (free): see workers/README.md. Set secrets RESEND_API_KEY and
   RESEND_AUDIENCE_ID, and (optionally) the var ALLOW_ORIGIN to your site URL. */

export default {
  async fetch(request, env) {
    const origin = env.ALLOW_ORIGIN || "*";
    const cors = {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405, cors);
    }

    let email;
    try {
      ({ email } = await request.json());
    } catch {
      return json({ error: "Bad request" }, 400, cors);
    }
    email = (email || "").trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return json({ error: "Please enter a valid email." }, 400, cors);
    }

    const r = await fetch(
      `https://api.resend.com/audiences/${env.RESEND_AUDIENCE_ID}/contacts`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, unsubscribed: false }),
      }
    );

    // Resend returns 422 if the contact already exists — treat as success.
    if (r.ok || r.status === 422) return json({ ok: true }, 200, cors);

    return json({ error: "Could not subscribe right now." }, 502, cors);
  },
};

function json(body, status, cors) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...cors },
  });
}
