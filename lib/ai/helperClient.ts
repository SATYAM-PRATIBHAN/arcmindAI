import { ChatOpenAI } from "@langchain/openai";

export const openAiLLM = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0.7,
  apiKey: process.env.OPENAI_API_KEY,
});
