export function otpEmailTemplate(otp: string, username: string) {
  return `
    <html>
      <body style="font-family: 'Inter', sans-serif; background-color: #f9f9f9; padding: 40px;">
        <div style="max-width: 500px; margin: auto; background: #ffffff; border-radius: 12px; padding: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
          <h2 style="color: #333; text-align: center;">Email Verification</h2>
          <p style="font-size: 15px; color: #555;">Hi <strong>${username}</strong>,</p>
          <p style="font-size: 15px; color: #555;">
            Thank you for signing up with <b>ArcMindAI</b>! Please use the OTP below to verify your account.
          </p>
          <div style="font-size: 30px; text-align: center; margin: 25px 0; color: #007bff; font-weight: bold;">
            ${otp}
          </div>
          <p style="font-size: 13px; color: #888;">This OTP will expire in 10 minutes.</p>
          <p style="font-size: 13px; color: #aaa; text-align: center;">&copy; ${new Date().getFullYear()} ArcMindAI. All rights reserved.</p>
        </div>
      </body>
    </html>
    `;
}
