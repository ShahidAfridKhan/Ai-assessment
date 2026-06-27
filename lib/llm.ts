/**
 * Provider-swappable LLM factory.
 * Default: Google Gemini (free tier via AI Studio).
 */

import { BaseChatModel } from "@langchain/core/language_models/chat_models";

export function getLLM(options?: {
  temperature?: number;
  maxTokens?: number;
}): BaseChatModel {
  const provider = (process.env.LLM_PROVIDER ?? "gemini").toLowerCase();
  const temperature = options?.temperature ?? 0.1;
  const maxTokens = options?.maxTokens ?? 4096;

  switch (provider) {
    case "groq": {
      const { ChatGroq } = require("@langchain/groq");
      return new ChatGroq({
        apiKey: process.env.GROQ_API_KEY,
        model: "llama-3.3-70b-versatile",
        temperature,
        maxTokens,
      });
    }

    case "openai": {
      const { ChatOpenAI } = require("@langchain/openai");
      return new ChatOpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        model: "gpt-4o",
        temperature,
        maxTokens,
      });
    }

    case "anthropic": {
      const { ChatAnthropic } = require("@langchain/anthropic");
      return new ChatAnthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
        model: "claude-sonnet-4-5",
        temperature,
        maxOutputTokens: maxTokens,
      });
    }

    case "gemini":
    default: {
      const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
      return new ChatGoogleGenerativeAI({
        apiKey: process.env.GEMINI_API_KEY,
        model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
        temperature,
        maxOutputTokens: maxTokens,
      });
    }
  }
}

export function getStructuredLLM(options?: {
  temperature?: number;
  maxTokens?: number;
}): BaseChatModel {
  return getLLM({ temperature: 0.0, maxTokens: options?.maxTokens ?? 4096 });
}
