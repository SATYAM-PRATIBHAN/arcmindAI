// filename: mailer.ts
import nodemailer from "nodemailer";
import { google } from "googleapis";

/**
 * Required environment variables:
 * - GOOGLE_CLIENT_ID
 * - GOOGLE_CLIENT_SECRET
 * - GOOGLE_REFRESH_TOKEN
 * - ADMIN_EMAIL
 * Optional (only needed for generating initial tokens via web flow):
 * - GOOGLE_REDIRECT_URI
 *
 * Security:
 * - Keep secrets server-side only (never expose to client).
 * - Store in environment/secrets manager; avoid logging them.
 */

const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REFRESH_TOKEN,
  GOOGLE_REDIRECT_URI, // optional unless you’re running the auth flow to obtain tokens
  ADMIN_EMAIL,
} = process.env;

// Fail fast: clear error if any required env vars are missing
if (
  !GOOGLE_CLIENT_ID ||
  !GOOGLE_CLIENT_SECRET ||
  !GOOGLE_REFRESH_TOKEN ||
  !ADMIN_EMAIL
) {
  throw new Error(
    "Missing OAuth2 configuration. Ensure GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN, and ADMIN_EMAIL are set.",
  );
}

// For refresh-only use, redirect URI is not required by google.auth.OAuth2 constructor.
// If you’re actively exchanging auth codes (web flow), include the redirect URI.
const oAuth2Client = GOOGLE_REDIRECT_URI
  ? new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI,
    )
  : new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);

// Set long-lived refresh token
oAuth2Client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });

// Helper: obtain a fresh access token safely
async function getAccessToken(): Promise<string> {
  try {
    // googleapis types can return string | null | undefined in { token }
    const res = await oAuth2Client.getAccessToken();
    const token = typeof res === "string" ? res : res?.token;
    if (!token) {
      throw new Error(
        "Failed to obtain access token from Google OAuth2 client.",
      );
    }
    return token;
  } catch (error: unknown) {
    // Bubble up useful OAuth error details
    const errorObj = error as {
      response?: {
        data?: {
          error_description?: string;
          error?: string;
        };
      };
      message?: string;
    };
    const message =
      errorObj?.response?.data?.error_description ||
      errorObj?.response?.data?.error ||
      errorObj?.message ||
      "Unknown error while refreshing access token.";
    // Example: invalid_grant indicates revoked/expired refresh token
    console.error("OAuth2 access token refresh error:", message);
    throw new Error(message);
  }
}

export async function sendMail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}) {
  // Acquire a fresh access token for each send
  const accessToken = await getAccessToken();

  // Create transporter
  const transporter = nodemailer.createTransport({
    // Nodemailer’s types sometimes don’t include `service` for OAuth2, but it works.
    // Alternatively, use `host: "smtp.gmail.com", port: 465, secure: true`.
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: ADMIN_EMAIL,
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      refreshToken: GOOGLE_REFRESH_TOKEN,
      accessToken,
    },
    // For reliability; Gmail supports pooled connections but often single send is fine.
    // tls: { rejectUnauthorized: true }, // default; can help catch cert issues
  });

  // Optional: verify transporter early to fail fast on auth/misconfig
  try {
    await transporter.verify();
  } catch (err) {
    console.error("Nodemailer transporter verification failed:", err);
    throw err;
  }

  const mailOptions = {
    from: `ArcMindAI <${ADMIN_EMAIL}>`,
    to,
    subject,
    text,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (err: unknown) {
    // Surface SMTP/OAuth failures clearly
    const errorObj = err as {
      code?: string;
      responseCode?: string;
      message?: string;
    };
    const code = errorObj?.code || errorObj?.responseCode;
    const msg = errorObj?.message || "Error sending email";
    console.error("Error sending email:", code, msg);
    // Common: 535 auth failure if token invalid/expired; handle re-auth outside
    throw err;
  }
}
