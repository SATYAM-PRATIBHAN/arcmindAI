export function forgotPasswordEmailTemplate(
  username: string,
  resetUrl: string,
) {
  return `
    <html>
      <body style="font-family: 'Inter', sans-serif; background-color: #f8f9fb; border-radius: 14px; padding: 10px; margin: 0;">
        <div style="max-width: 520px; margin: auto; background: #ffffff; border-radius: 14px; padding: 40px 35px; box-shadow: 0 4px 14px rgba(0,0,0,0.08);">

          <!-- Header -->
          <div style="text-align: center;">
            <h1 style="color: #222; margin-bottom: 4px;">Password Reset Request</h1>
            <p style="color: #666; font-size: 14px; margin-top: 0;">Reset your ArcMindAI password</p>
          </div>

          <!-- Divider -->
          <div style="height: 1px; background: #eee; margin: 24px 0;"></div>

          <!-- Body -->
          <p style="color: #444; font-size: 15px;">Hi <strong>${username}</strong>,</p>
          <p style="color: #555; font-size: 15px; line-height: 1.6;">
            We received a request to reset your password for your ArcMindAI account. If you made this request, click the button below to reset your password.
          </p>
          <p style="color: #555; font-size: 15px; line-height: 1.6;">
            This link will expire in 1 hour for security reasons.
          </p>

          <!-- Call to Action -->
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetUrl}"
               style="background-color: #4f46e5; color: white; text-decoration: none;
               padding: 12px 28px; border-radius: 8px; font-size: 15px; display: inline-block;">
              Reset Password
            </a>
          </div>

          <!-- Alternative Link -->
          <p style="color: #888; font-size: 13px; text-align: center;">
            If the button doesn't work, copy and paste this link into your browser:
            <br>
            <a href="${resetUrl}" style="color: #4f46e5; word-break: break-all;">Click here</a>
          </p>

          <!-- Security Note -->
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <p style="color: #856404; font-size: 14px; margin: 0;">
              <strong>Didn't request this?</strong> If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
            </p>
          </div>

          <!-- Footer -->
          <p style="color: #888; font-size: 13px; text-align: center; margin-top: 24px;">
            Need help? Contact our support team anytime at
            <a href="mailto:${process.env.ADMIN_EMAIL}" style="color: #4f46e5; text-decoration: none;">${process.env.ADMIN_EMAIL}</a>
          </p>

          <p style="color: #aaa; font-size: 12px; text-align: center; margin-top: 12px;">
            &copy; ${new Date().getFullYear()} arcmindAI. All rights reserved.
          </p>
        </div>
      </body>
    </html>
    `;
}
