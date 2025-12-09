import { db } from "@/lib/prisma";
import { decryptApiKey } from "@/lib/crypto/encryption";

export type UserApiKeys = {
  geminiApiKey?: string;
  openaiApiKey?: string;
};

/**
 * Fetches and decrypts user's API keys from the database
 * @param userId - The user's ID
 * @returns Decrypted API keys or undefined if not set
 */
export async function getUserApiKeys(userId: string): Promise<UserApiKeys> {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        geminiApiKey: true,
        openaiApiKey: true,
        encryptionKey: true,
      },
    });

    if (!user || !user.encryptionKey) {
      return {};
    }

    const keys: UserApiKeys = {};

    // Decrypt Gemini API key if exists
    if (user.geminiApiKey) {
      try {
        keys.geminiApiKey = decryptApiKey(
          user.geminiApiKey,
          user.encryptionKey,
        );
      } catch (error) {
        console.error("Failed to decrypt Gemini API key:", error);
      }
    }

    // Decrypt OpenAI API key if exists
    if (user.openaiApiKey) {
      try {
        keys.openaiApiKey = decryptApiKey(
          user.openaiApiKey,
          user.encryptionKey,
        );
      } catch (error) {
        console.error("Failed to decrypt OpenAI API key:", error);
      }
    }

    return keys;
  } catch (error) {
    console.error("Error fetching user API keys:", error);
    return {};
  }
}
