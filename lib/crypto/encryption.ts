import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * Generates a random encryption key for a user
 * @returns A hex-encoded encryption key
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString("hex");
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
      100000,
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
      100000,
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
  provider: "gemini" | "openai",
): boolean {
  if (!apiKey || typeof apiKey !== "string") {
    return false;
  }

  // Gemini API keys typically start with "AI" and are alphanumeric
  if (provider === "gemini") {
    return /^AI[a-zA-Z0-9_-]{30,}$/.test(apiKey);
  }

  // OpenAI API keys typically start with "sk-" and contain alphanumeric characters
  if (provider === "openai") {
    return /^sk-[a-zA-Z0-9]{20,}$/.test(apiKey);
  }

  return false;
}
