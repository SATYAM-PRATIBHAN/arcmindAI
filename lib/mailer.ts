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

const isMailConfigured =
  !!GOOGLE_CLIENT_ID &&
  !GOOGLE_CLIENT_ID.includes("dummy") &&
  !!GOOGLE_CLIENT_SECRET &&
  !GOOGLE_CLIENT_SECRET.includes("dummy") &&
  !!GOOGLE_REFRESH_TOKEN &&
  !GOOGLE_REFRESH_TOKEN.includes("dummy") &&
  !!ADMIN_EMAIL &&
  !ADMIN_EMAIL.includes("example.com");

if (!isMailConfigured) {
  console.warn(
    "[mailer] Google OAuth2 not fully configured or contains dummy values — email sending is simulated via console logging.",
  );
}

// For refresh-only use, redirect URI is not required by google.auth.OAuth2 constructor.
// If you’re actively exchanging auth codes (web flow), include the redirect URI.
const oAuth2Client =
  isMailConfigured && GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET
    ? GOOGLE_REDIRECT_URI
      ? new google.auth.OAuth2(
          GOOGLE_CLIENT_ID,
          GOOGLE_CLIENT_SECRET,
          GOOGLE_REDIRECT_URI,
        )
      : new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
    : null;

// Set long-lived refresh token
if (oAuth2Client && GOOGLE_REFRESH_TOKEN) {
  oAuth2Client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });
}

// Helper: obtain a fresh access token safely
async function getAccessToken(): Promise<string> {
  if (!isMailConfigured || !oAuth2Client) {
    return "mock-access-token";
  }
  try {
    const res = await oAuth2Client.getAccessToken();
    const token = typeof res === "string" ? res : res?.token;
    if (!token) {
      throw new Error(
        "Failed to obtain access token from Google OAuth2 client.",
      );
    }
    return token;
  } catch (error: unknown) {
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
    console.error("OAuth2 access token refresh error:", message);

    // In local dev, gracefully fall back instead of crashing
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[mailer] OAuth2 access token refresh failed. Falling back to simulated email logging.",
      );
      return "mock-access-token";
    }
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
  if (!isMailConfigured) {
    console.log(
      `\n========================================\n` +
        `[SIMULATED EMAIL SENT]\n` +
        `From: ArcMindAI <admin@example.com>\n` +
        `To: ${to}\n` +
        `Subject: ${subject}\n` +
        `Body:\n${text || html || "(empty)"}\n` +
        `========================================\n`,
    );
    return { messageId: "simulated-id", response: "250 OK" };
  }

  try {
    // Acquire a fresh access token for each send
    const accessToken = await getAccessToken();

    if (accessToken === "mock-access-token") {
      console.log(
        `\n========================================\n` +
          `[SIMULATED EMAIL SENT (FALLBACK)]\n` +
          `From: ArcMindAI <${ADMIN_EMAIL}>\n` +
          `To: ${to}\n` +
          `Subject: ${subject}\n` +
          `Body:\n${text || html || "(empty)"}\n` +
          `========================================\n`,
      );
      return { messageId: "simulated-id", response: "250 OK" };
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: ADMIN_EMAIL,
        clientId: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        refreshToken: GOOGLE_REFRESH_TOKEN,
        accessToken,
      },
    });

    // Verify transporter connection configuration
    try {
      await transporter.verify();
    } catch (err) {
      console.error("Nodemailer transporter verification failed:", err);
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          "[mailer] Transporter verification failed. Falling back to simulated email logging.",
        );
        return { messageId: "simulated-id", response: "250 OK" };
      }
      throw err;
    }

    const mailOptions = {
      from: `ArcMindAI <${ADMIN_EMAIL}>`,
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    return info;
  } catch (err: unknown) {
    const errorObj = err as {
      code?: string;
      responseCode?: string;
      message?: string;
    };
    const code = errorObj?.code || errorObj?.responseCode;
    const msg = errorObj?.message || "Error sending email";
    console.error("Error sending email:", code, msg);

    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[mailer] Failed to send email via SMTP. Falling back to simulated email logging.",
      );
      return { messageId: "simulated-id", response: "250 OK" };
    }
    throw err;
  }
}
