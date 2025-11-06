export function welcomeEmailTemplate(username: string) {
  return `
    <html>
      <body style="font-family: 'Inter', sans-serif; background-color: #f8f9fb; border-radius: 14px; padding: 10px; margin: 0;">
        <div style="max-width: 520px; margin: auto; background: #ffffff; border-radius: 14px; padding: 40px 35px; box-shadow: 0 4px 14px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <div style="text-align: center;">
            <h1 style="color: #222; margin-bottom: 4px;">Welcome to ArcMindAI 🎉</h1>
            <p style="color: #666; font-size: 14px; margin-top: 0;">Your AI-powered workspace is ready</p>
          </div>
  
          <!-- Divider -->
          <div style="height: 1px; background: #eee; margin: 24px 0;"></div>
  
          <!-- Body -->
          <p style="color: #444; font-size: 15px;">Hey <strong>${username}</strong>,</p>
          <p style="color: #555; font-size: 15px; line-height: 1.6;">
            Welcome to <strong>arcmindAI</strong>! Your email has been successfully verified and your account is now active.
            You can start exploring our platform to build, collaborate, and deploy AI-powered applications effortlessly.
          </p>
  
          <!-- Call to Action -->
          <div style="text-align: center; margin: 32px 0;">
            <a href="${process.env.NEXT_PUBLIC_BASE_URL}/generate" 
               style="background-color: #4f46e5; color: white; text-decoration: none; 
               padding: 12px 28px; border-radius: 8px; font-size: 15px; display: inline-block;">
              Go to Generation
            </a>
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
