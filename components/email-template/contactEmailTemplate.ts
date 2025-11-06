import { ContactFormSchema } from "@/lib/validation/contactFormSchema";

export function getContactEmailTemplate(formData: ContactFormSchema) {
  const { firstname, lastname, email, message } = formData;
  const fullname = `${firstname} ${lastname}`;

  const subject = `Contact Form Submission from ${fullname}`;

  const text = `
Hello,

You have received a new contact form submission from ${fullname}.

Email: ${email}

Message:
${message}

Best regards,
ArcMindAI Team
  `.trim();

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contact Form Submission</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #f4f4f4; padding: 10px; text-align: center; }
    .content { padding: 20px; }
    .footer { background-color: #f4f4f4; padding: 10px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Contact Form Submission</h2>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>You have received a new contact form submission from <strong>${fullname}</strong>.</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Message:</strong></p>
      <p>${message.replace(/\n/g, "<br>")}</p>
      <p>Best regards,<br>ArcMindAI Team</p>
    </div>
    <div class="footer">
      <p>This email was sent from the ArcMindAI contact form.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return { subject, text, html };
}
