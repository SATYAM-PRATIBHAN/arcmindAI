import { GrievanceFormData } from "@/lib/validation/grievanceFormSchema";

export function getGrievanceEmailTemplate(
  formData: GrievanceFormData & { userEmail: string; username?: string },
) {
  const { rating, reason, userEmail, username = "User" } = formData;
  const userDisplay = username || userEmail;

  const subject = `Subscription Cancellation Grievance from ${userDisplay}`;

  const text = `
Hello,

You have received a new subscription cancellation grievance from ${userDisplay}.

Email: ${userEmail}
Rating: ${rating}
Reason:
${reason}

Best regards,
ArcMindAI Team
  `.trim();

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Subscription Cancellation Grievance</title>
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
      <h2>Subscription Cancellation Grievance</h2>
    </div>
    <div class="content">
      <p>Hello,</p>
      <p>You have received a new subscription cancellation grievance from <strong>${userDisplay}</strong>.</p>
      <p><strong>Email:</strong> ${userEmail}</p>
      <p><strong>Rating:</strong> ${rating}</p>
      <p><strong>Reason:</strong></p>
      <p>${reason.replace(/\n/g, "<br>")}</p>
      <p>Best regards,<br>ArcMindAI Team</p>
    </div>
    <div class="footer">
      <p>This email was sent from the ArcMindAI grievance form.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  return { subject, text, html };
}
