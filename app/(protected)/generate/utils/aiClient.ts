// src/app/generate/utils/aiClient.ts
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
// import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

// ✅ Core Gemini LLM setup (LangChain compatible)
export const geminiLLM = new ChatGoogleGenerativeAI({
  model: "gemini-2.0-flash", // You can change to "gemini-2.5-pro" for better reasoning
  temperature: 0.7,
  apiKey: process.env.GEMINI_API_KEY,
});

// ✅ Optional embeddings setup (for vector search later)
// export const geminiEmbeddings = new GoogleGenerativeAIEmbeddings({
//   model: "text-embedding-004", // Gemini's latest embedding model
//   apiKey: process.env.GEMINI_API_KEY!,
// });
