export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, phone, email, address, service, contact, message } = req.body;

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
        subject: "New Quote Request - Lynch Industries",
        text: `
New quote request from Lynch Industries website:

Name: ${name}
Phone: ${phone}
Email: ${email}
Project Address: ${address}
Service Needed: ${service}
Preferred Contact: ${contact}

Description:
${message}
        `,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return res.status(500).json({ error });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: "Email failed to send." });
  }
}
