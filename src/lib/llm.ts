import { GoogleGenAI } from "@google/genai";

/**
 * Agri-Koushol LLM abstraction wrapper
 * All Gemini interactions are routed behind this module per project architectural rules.
 */
const apiKey = process.env.GEMINI_API_KEY || "";

export const genai = new GoogleGenAI({
  apiKey,
});

export const DEFAULT_MODEL = "gemini-2.5-flash";
