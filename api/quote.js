const recipients = ["lynchindustries01@gmail.com", "tsaraiva1667@gmail.com"];
const allowedAttachmentTypes = ["image/jpeg", "image/png", "image/webp"];
const maxAttachments = 3;
const maxAttachmentBase64Length = 900 * 1024;

function clean(value) {
  return String(value || "").trim();
}

function escapeHtml(value) {
  return clean(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.RESEND_API_KEY) {
    return res.status(500).json({ error: "Missing RESEND_API_KEY in Vercel environment variables" });
  }

  const name = clean(req.body?.name);
  const phone = clean(req.body?.phone);
  const email = clean(req.body?.email);
  const address = clean(req.body?.address);
  const service = clean(req.body?.service);
  const contact = clean(req.body?.contact);
  const message = clean(req.body?.message);
  const rawAttachments = Array.isArray(req.body?.attachments) ? req.body.attachments : [];

  if (!name || !phone || !message) {
    return res.status(400).json({ error: "Name, phone, and message are required" });
  }

  if (rawAttachments.length > maxAttachments) {
    return res.status(400).json({ error: "Too many attachments" });
  }

  const attachments = [];

  for (let index = 0; index < rawAttachments.length; index += 1) {
    const attachment = rawAttachments[index];
    const filename = clean(attachment?.filename) || `project-photo-${index + 1}.jpg`;
    const content = clean(attachment?.content);
    const contentType = clean(attachment?.type);

    if (!allowedAttachmentTypes.includes(contentType)) {
      return res.status(400).json({ error: "Unsupported attachment type" });
    }

    if (!content || content.length > maxAttachmentBase64Length) {
      return res.status(400).json({ error: "Invalid attachment size" });
    }

    attachments.push({
      filename,
      content,
    });
  }

  const submittedAt = new Date().toLocaleString("en-US", {
    timeZone: "America/New_York",
    dateStyle: "medium",
    timeStyle: "short",
  });

  const from = process.env.RESEND_FROM_EMAIL || "Lynch Industries <onboarding@resend.dev>";
  const replyTo = email && email.includes("@") ? email : undefined;

  const text = [
    "New quote request from the Lynch Industries website:",
    "",
    `Submitted: ${submittedAt}`,
    `Name: ${name}`,
    `Phone: ${phone}`,
    `Email: ${email || "Not provided"}`,
    `Project Address: ${address || "Not provided"}`,
    `Service Needed: ${service || "Not provided"}`,
    `Preferred Contact: ${contact || "Not provided"}`,
    "",
    "Description:",
    message,
  ].join("\n");

  const html = `
    <h2>New quote request</h2>
    <p><strong>Submitted:</strong> ${escapeHtml(submittedAt)}</p>
    <table cellpadding="8" cellspacing="0" style="border-collapse:collapse;font-family:Arial,sans-serif">
      <tr><td><strong>Name</strong></td><td>${escapeHtml(name)}</td></tr>
      <tr><td><strong>Phone</strong></td><td>${escapeHtml(phone)}</td></tr>
      <tr><td><strong>Email</strong></td><td>${escapeHtml(email || "Not provided")}</td></tr>
      <tr><td><strong>Project Address</strong></td><td>${escapeHtml(address || "Not provided")}</td></tr>
      <tr><td><strong>Service Needed</strong></td><td>${escapeHtml(service || "Not provided")}</td></tr>
      <tr><td><strong>Preferred Contact</strong></td><td>${escapeHtml(contact || "Not provided")}</td></tr>
    </table>
    <h3>Description</h3>
    <p style="white-space:pre-wrap">${escapeHtml(message)}</p>
  `;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: recipients,
        reply_to: replyTo,
        subject: `New Quote Request - ${name}`,
        text,
        html,
        attachments,
      }),
    });

    const result = await response.json().catch(async () => ({ error: await response.text() }));

    if (!response.ok) {
      console.error("Resend error:", result);
      return res.status(500).json({ error: "Email failed to send", details: result });
    }

    return res.status(200).json({ success: true, id: result.id });
  } catch (error) {
    console.error("Quote email error:", error);
    return res.status(500).json({ error: "Email failed to send" });
  }
}
