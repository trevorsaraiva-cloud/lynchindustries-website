export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, phone, email, address, service, contact, message } = req.body || {};

  if (!name || !phone || !message) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Lynch Industries <onboarding@resend.dev>",
        to: ["lynchindustries01@gmail.com", "tsaraiva1667@gmail.com"],
        reply_to: email || undefined,
        subject: "New Quote Request - Lynch Industries",
        text: `New quote request from Lynch Industries website:\n\nName: ${name}\nPhone: ${phone}\nEmail: ${email || "Not provided"}\nProject Address: ${address || "Not provided"}\nService Needed: ${service || "Not provided"}\nPreferred Contact: ${contact || "Not provided"}\n\nDescription:\n${message}`,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return res.status(500).json({ error });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: "Email failed to send" });
  }
}
