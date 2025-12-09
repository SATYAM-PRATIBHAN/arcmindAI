import { ChatOpenAI } from "@langchain/openai";
import { BaseMessage } from "@langchain/core/messages";

export const openAiLLM = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0.7,
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Creates an OpenAI client with a custom API key
 */
function createOpenAIClient(apiKey: string): ChatOpenAI {
  return new ChatOpenAI({
    model: "gpt-4o-mini",
    temperature: 0.7,
    apiKey,
  });
}

/**
 * Checks if an error indicates we should fallback to the next API key
 */
function shouldFallback(error: unknown): boolean {
  if (!error) return false;

  const errorMessage =
    error instanceof Error
      ? error.message.toLowerCase()
      : String(error).toLowerCase();
  const errorString = JSON.stringify(error).toLowerCase();

  // Check for rate limit errors
  if (
    errorMessage.includes("too many requests") ||
    errorMessage.includes("rate limit") ||
    errorMessage.includes("quota exceeded") ||
    errorMessage.includes("quota") ||
    errorString.includes("429") ||
    errorString.includes("insufficient_quota")
  ) {
    return true;
  }

  // Check for API key or authentication errors
  if (
    errorMessage.includes("api key not found") ||
    errorMessage.includes("invalid api key") ||
    errorMessage.includes("incorrect api key") ||
    errorMessage.includes("api key") ||
    errorMessage.includes("authentication") ||
    errorMessage.includes("unauthorized") ||
    errorString.includes("401") ||
    errorString.includes("403")
  ) {
    return true;
  }

  return false;
}

export type OpenAIFallbackResult = {
  response: Awaited<ReturnType<typeof openAiLLM.invoke>>;
  usedUserKey: boolean;
  allKeysFailed: boolean;
};

/**
 * Invokes the OpenAI LLM with automatic two-tier fallback:
 * 1. User's personal API key (if provided)
 * 2. System API key (OPENAI_API_KEY)
 *
 * @param messages - The messages to send to the LLM
 * @param userApiKey - Optional user's personal API key (decrypted)
 * @returns Object containing response and metadata about which key was used
 */
export async function invokeOpenAIWithFallback(
  messages: BaseMessage[],
  userApiKey?: string,
): Promise<OpenAIFallbackResult> {
  let usedUserKey = false;
  let allKeysFailed = false;

  // Tier 1: Try user's personal API key first (if provided)
  if (userApiKey) {
    try {
      console.log("Attempting OpenAI generation with user's personal API key");
      const userClient = createOpenAIClient(userApiKey);
      const response = await userClient.invoke(messages);
      usedUserKey = true;
      return { response, usedUserKey, allKeysFailed };
    } catch (error) {
      console.warn(
        "User's OpenAI API key failed, falling back to system key:",
        error,
      );
      // Continue to system key
    }
  }

  // Tier 2: Try system API key
  try {
    console.log("Attempting OpenAI generation with system API key");
    const response = await openAiLLM.invoke(messages);
    return { response, usedUserKey, allKeysFailed };
  } catch (error) {
    if (shouldFallback(error)) {
      console.error("All OpenAI API keys failed:", error);
      allKeysFailed = true;
    }
    // Re-throw the error
    throw error;
  }
}
