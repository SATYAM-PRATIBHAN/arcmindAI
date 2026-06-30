import crypto from "crypto";

// Encryption algorithm
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // For AES, this is always 16
const SALT_LENGTH = 64;
const KEY_LENGTH = 32;
const PBKDF2_ITERATIONS = 100000;

export type APIKeyProvider = "gemini" | "openai";

/**
 * Get encryption key from environment variable
 * If not set, throw error
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error(
      "ENCRYPTION_KEY environment variable is not set. Please generate a 32-byte key using: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
    );
  }

  // Convert hex string to buffer
  const keyBuffer = Buffer.from(key, "hex");

  if (keyBuffer.length !== KEY_LENGTH) {
    throw new Error(
      `ENCRYPTION_KEY must be ${KEY_LENGTH} bytes (64 hex characters). Current length: ${keyBuffer.length} bytes`,
    );
  }

  return keyBuffer;
}

/**
 * Generates a random encryption key for a user
 * @returns A hex-encoded encryption key
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString("hex");
}

/**
 * Encrypt a token using AES-256-GCM
 * @param token - Plain text token to encrypt
 * @returns Encrypted token as string (format: v2:iv:encrypted:authTag:salt)
 */
export function encryptToken(token: string): string {
  try {
    const encryptionKey = getEncryptionKey();

    // Generate random IV and salt
    const iv = crypto.randomBytes(IV_LENGTH);
    const salt = crypto.randomBytes(SALT_LENGTH);

    // Derive key from encryption key and salt
    const key = crypto.pbkdf2Sync(
      encryptionKey,
      salt,
      PBKDF2_ITERATIONS,
      KEY_LENGTH,
      "sha512",
    );

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    // Encrypt the token
    let encrypted = cipher.update(token, "utf8", "hex");
    encrypted += cipher.final("hex");

    // Get authentication tag
    const authTag = cipher.getAuthTag();

    // Return format: v2:iv:encrypted:authTag:salt
    return `v2:${iv.toString("hex")}:${encrypted}:${authTag.toString("hex")}:${salt.toString("hex")}`;
  } catch (error) {
    console.error("Error encrypting token:", error);
    throw new Error("Failed to encrypt token");
  }
}

/**
 * Decrypt a token using AES-256-GCM
 * Supports both the new v2 format and legacy (iv:encrypted:authTag) format.
 * @param encryptedToken - Encrypted token string
 * @returns Decrypted plain text token
 */
export function decryptToken(encryptedToken: string): string {
  try {
    const encryptionKey = getEncryptionKey();

    // Split the encrypted token into its components
    const parts = encryptedToken.split(":");

    if (parts.length === 5 && parts[0] === "v2") {
      // New format: v2:iv:encrypted:authTag:salt
      const [, ivHex, encrypted, authTagHex, saltHex] = parts;

      // Convert from hex
      const iv = Buffer.from(ivHex, "hex");
      const authTag = Buffer.from(authTagHex, "hex");
      const salt = Buffer.from(saltHex, "hex");

      // Derive key from encryption key and salt
      const key = crypto.pbkdf2Sync(
        encryptionKey,
        salt,
        PBKDF2_ITERATIONS,
        KEY_LENGTH,
        "sha512",
      );

      // Create decipher
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);

      // Decrypt the token
      let decrypted = decipher.update(encrypted, "hex", "utf8");
      decrypted += decipher.final("utf8");

      return decrypted;
    }

    if (parts.length === 3) {
      // Legacy format: iv:encrypted:authTag (raw key, no PBKDF2)
      const [ivHex, encrypted, authTagHex] = parts;

      // Convert from hex
      const iv = Buffer.from(ivHex, "hex");
      const authTag = Buffer.from(authTagHex, "hex");

      // Create decipher
      const decipher = crypto.createDecipheriv(ALGORITHM, encryptionKey, iv);
      decipher.setAuthTag(authTag);

      // Decrypt the token
      let decrypted = decipher.update(encrypted, "hex", "utf8");
      decrypted += decipher.final("utf8");

      return decrypted;
    }

    throw new Error("Invalid encrypted token format");
  } catch (error) {
    console.error("Error decrypting token:", error);
    throw new Error("Failed to decrypt token");
  }
}

/**
 * Encrypts an API key using AES-256-GCM
 * @param apiKey - The API key to encrypt
 * @param encryptionKey - The hex-encoded encryption key
 * @returns The encrypted API key in format: iv:encrypted:authTag:salt
 */
export function encryptApiKey(apiKey: string, encryptionKey: string): string {
  try {
    // Generate random IV and salt
    const iv = crypto.randomBytes(IV_LENGTH);
    const salt = crypto.randomBytes(SALT_LENGTH);

    // Derive key from encryption key and salt
    const key = crypto.pbkdf2Sync(
      Buffer.from(encryptionKey, "hex"),
      salt,
      PBKDF2_ITERATIONS,
      KEY_LENGTH,
      "sha512",
    );

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    // Encrypt the API key
    let encrypted = cipher.update(apiKey, "utf8", "hex");
    encrypted += cipher.final("hex");

    // Get authentication tag
    const authTag = cipher.getAuthTag();

    // Return format: iv:encrypted:authTag:salt
    return `${iv.toString("hex")}:${encrypted}:${authTag.toString("hex")}:${salt.toString("hex")}`;
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt API key");
  }
}

/**
 * Decrypts an API key using AES-256-GCM
 * @param encryptedKey - The encrypted API key in format: iv:encrypted:authTag:salt
 * @param encryptionKey - The hex-encoded encryption key
 * @returns The decrypted API key
 */
export function decryptApiKey(
  encryptedKey: string,
  encryptionKey: string,
): string {
  try {
    // Parse the encrypted key
    const parts = encryptedKey.split(":");
    if (parts.length !== 4) {
      throw new Error("Invalid encrypted key format");
    }

    const [ivHex, encrypted, authTagHex, saltHex] = parts;

    // Convert from hex
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const salt = Buffer.from(saltHex, "hex");

    // Derive key from encryption key and salt
    const key = crypto.pbkdf2Sync(
      Buffer.from(encryptionKey, "hex"),
      salt,
      PBKDF2_ITERATIONS,
      KEY_LENGTH,
      "sha512",
    );

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    // Decrypt the API key
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt API key");
  }
}

/**
 * Validates if a string is a valid API key format
 * @param apiKey - The API key to validate
 * @param provider - The provider (gemini or openai)
 * @returns True if valid, false otherwise
 */
export function validateApiKeyFormat(
  apiKey: string,
  provider: APIKeyProvider,
): boolean {
  if (!apiKey || typeof apiKey !== "string") {
    return false;
  }

  // Gemini API keys typically start with "AI" and are alphanumeric
  if (provider === "gemini") {
    return /^AI[a-zA-Z0-9_-]{30,}$/.test(apiKey);
  }

  // OpenAI API keys typically start with "sk-" and contain alphanumeric characters, hyphens, and underscores
  if (provider === "openai") {
    return /^sk-[a-zA-Z0-9_-]{20,}$/.test(apiKey);
  }

  return false;
}
