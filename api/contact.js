const limits = { name: 100, company: 160, email: 254, phone: 16, message: 2000 };
const leadEndpoint = "https://iqslhvedtjcojcgnlfah.supabase.co/functions/v1/contact-lead";

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const secret = process.env.SUPABASE_LEAD_TOKEN;

  if (req.method === "GET") return res.status(200).json({ available: Boolean(secret) });
  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Método inválido." });
  }
  if (!secret) return res.status(503).json({ error: "O formulário está indisponível. Fale com a gente pelo WhatsApp." });
  if (!/^application\/json(?:\s*;|$)/i.test(req.headers["content-type"] ?? "")) {
    return res.status(415).json({ error: "Formato de envio inválido." });
  }

  const data = Object.fromEntries(Object.entries(limits).map(([key]) => [
    key, typeof req.body?.[key] === "string" ? req.body[key].trim() : ""
  ]));
  const valid = Object.entries(limits).every(([key, max]) => data[key] && data[key].length <= max)
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)
    && /^\([0-9]{2}\) [0-9]\.[0-9]{4}-[0-9]{4}$/.test(data.phone);
  if (!valid) return res.status(400).json({ error: "Confira os campos e tente novamente." });

  try {
    const saved = await fetch(leadEndpoint, {
      method: "POST",
      headers: { "x-contact-token": secret, "Content-Type": "application/json" },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(8000)
    });
    if (saved.ok) return res.status(201).json({ saved: true });
  } catch {
    // The form retains the submitted fields after a failed request.
  }
  return res.status(502).json({ error: "Não foi possível registrar a mensagem. Tente novamente ou fale pelo WhatsApp." });
};
