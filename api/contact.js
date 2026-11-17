const limits = { name: 100, company: 160, email: 254, phone: 30, message: 2000 };

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  const { CONTACT_EMAIL, CONTACT_FROM_EMAIL, RESEND_API_KEY } = process.env;
  const available = Boolean(CONTACT_EMAIL && CONTACT_FROM_EMAIL && RESEND_API_KEY);

  if (req.method === "GET") return res.status(200).json({ available });
  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Método inválido." });
  }
  if (!available) return res.status(503).json({ error: "Envio por e-mail indisponível. Fale com a gente pelo WhatsApp." });

  const data = Object.fromEntries(Object.entries(limits).map(([key]) => [
    key, typeof req.body?.[key] === "string" ? req.body[key].trim() : ""
  ]));
  const valid = Object.entries(limits).every(([key, limit]) => data[key] && data[key].length <= limit)
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)
    && /^[+()\d\s.-]+$/.test(data.phone)
    && data.phone.replace(/\D/g, "").length >= 8;
  if (!valid) return res.status(400).json({ error: "Confira os campos e tente novamente." });

  const { name, company, email, phone, message } = data;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer " + RESEND_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: CONTACT_FROM_EMAIL,
        to: [CONTACT_EMAIL],
        reply_to: email,
        subject: "Novo contato pelo site da Traço Nítido",
        text: `Nome: ${name}\nEmpresa: ${company}\nE-mail: ${email}\nTelefone: ${phone}\n\nMensagem:\n${message}`
      }),
      signal: AbortSignal.timeout(8000)
    });
    if (response.ok) return res.status(200).json({ sent: true });
  } catch {
    // The browser keeps the form so the visitor can try again.
  }
  return res.status(502).json({ error: "Não foi possível enviar agora. Tente novamente ou fale pelo WhatsApp." });
};
