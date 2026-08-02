import { ChatOpenAI } from "@langchain/openai";

export const groqModel = new ChatOpenAI({
  model: "openai/gpt-oss-20b",
  apiKey: process.env.GROQ_API_KEY,
  configuration: {
    baseURL: "https://api.groq.com/openai/v1",
  },
});

export const openRouterModel = new ChatOpenAI({
  model: "meta-llama/llama-3-8b-instruct",
  apiKey: process.env.OPENROUTER_API_KEY,
  configuration: {
    baseURL: "https://openrouter.ai/api/v1",
  },
});
