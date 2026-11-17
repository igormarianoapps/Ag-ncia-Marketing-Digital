const expectedDigest = "7638731778fe03e5518a244c29e9c63d0bb912c83c816afc1e2908c9d90fe77b";

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response(null, { status: 405 });

  const token = req.headers.get("x-contact-token") ?? "";
  if (!/^[0-9a-f]{64}$/.test(token)) return new Response(null, { status: 401 });
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  const receivedDigest = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  if (receivedDigest !== expectedDigest) return new Response(null, { status: 401 });

  const url = Deno.env.get("SUPABASE_URL");
  const role = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !role) return new Response(null, { status: 503 });

  try {
    const input = await req.json();
    const { name, company, email, phone, message } = input;
    const saved = await fetch(url + "/rest/v1/contact_leads", {
      method: "POST",
      headers: { apikey: role, Authorization: "Bearer " + role, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ name, company, email, phone, message }),
      signal: AbortSignal.timeout(5000)
    });
    if (saved.ok) return new Response(null, { status: 201 });
    console.error("contact_leads insert failed", saved.status);
  } catch {
    return new Response(null, { status: 502 });
  }
  return new Response(null, { status: 502 });
});
