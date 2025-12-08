import crypto from "crypto";

// Encryption algorithm
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16; // For AES, this is always 16
const KEY_LENGTH = 32;

/**
 * Get encryption key from environment variable
 * If not set, throw error
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;

  if (!key) {
    throw new Error(
      "ENCRYPTION_KEY environment variable is not set. Please generate a 32-byte key using: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    );
  }

  // Convert hex string to buffer
  const keyBuffer = Buffer.from(key, "hex");

  if (keyBuffer.length !== KEY_LENGTH) {
    throw new Error(
      `ENCRYPTION_KEY must be ${KEY_LENGTH} bytes (64 hex characters). Current length: ${keyBuffer.length} bytes`
    );
  }

  return keyBuffer;
}

/**
 * Encrypt a token using AES-256-GCM
 * @param token - Plain text token to encrypt
 * @returns Encrypted token as base64 string (format: iv:encrypted:authTag)
 */
export function encryptToken(token: string): string {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);

    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(token, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag();

    // Combine iv, encrypted data, and auth tag
    // Format: iv:encrypted:authTag (all in hex)
    return `${iv.toString("hex")}:${encrypted}:${authTag.toString("hex")}`;
  } catch (error) {
    console.error("Error encrypting token:", error);
    throw new Error("Failed to encrypt token");
  }
}

/**
 * Decrypt a token using AES-256-GCM
 * @param encryptedToken - Encrypted token string (format: iv:encrypted:authTag)
 * @returns Decrypted plain text token
 */
export function decryptToken(encryptedToken: string): string {
  try {
    const key = getEncryptionKey();

    // Split the encrypted token into its components
    const parts = encryptedToken.split(":");

    if (parts.length !== 3) {
      throw new Error("Invalid encrypted token format");
    }

    const iv = Buffer.from(parts[0], "hex");
    const encrypted = parts[1];
    const authTag = Buffer.from(parts[2], "hex");

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Error decrypting token:", error);
    throw new Error("Failed to decrypt token");
  }
}

/**
 * Generate a new encryption key
 * This is a utility function for generating keys
 * @returns 32-byte key as hex string
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(KEY_LENGTH).toString("hex");
}
