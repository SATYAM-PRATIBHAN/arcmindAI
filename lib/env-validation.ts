const requiredVars = [
  "DATABASE_URL",
  "NEXTAUTH_SECRET",
  "JWT_SECRET",
  "ENCRYPTION_KEY",
  "GEMINI_API_KEY",
] as const;

const optionalVars = [
  "GEMINI_API_KEY_ALTERNATE",
  "OPENAI_API_KEY",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "ADMIN_EMAIL",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "NEXT_PUBLIC_BASE_URL",
  "DODO_PAYMENTS_API_KEY",
  "DODO_WEBHOOK_SECRET",
  "GITHUB_CLIENT_ID",
  "GITHUB_CLIENT_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_REFRESH_TOKEN",
  "GOOGLE_REDIRECT_URI",
  "GRIEVANCE_EMAIL",
  "API_BODY_LIMIT_BYTES",
  "MAX_REPO_TREE_SIZE",
  "MAX_REPO_DEPTH",
  "MAX_REPO_FILES_SCANNED",
] as const;

export function validateEnv(): void {
  const missing: string[] = [];

  for (const name of requiredVars) {
    if (!process.env[name]) {
      missing.push(name);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `FATAL: Missing required environment variables:\n  ${missing.join("\n  ")}\n\n` +
        "Please set them in your .env file or environment.",
    );
  }

  if (process.env.NODE_ENV === "development") {
    const missingOptional: string[] = [];
    for (const name of optionalVars) {
      if (!process.env[name]) {
        missingOptional.push(name);
      }
    }
    if (missingOptional.length > 0) {
      console.warn(
        `WARNING: Optional environment variables not set:\n  ${missingOptional.join("\n  ")}`,
      );
    }
  }
}
