import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

// Check if we have a valid API key (must start with AIza... for standard keys)
// OAuth tokens (starting with AQ.) are not supported for direct API calls
export const isGeminiAvailable = Boolean(API_KEY && API_KEY.length > 10);

export const genAI = isGeminiAvailable ? new GoogleGenerativeAI(API_KEY) : null;

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

// Text model – gemini-2.0-flash is the current stable model
export const geminiPro = genAI
  ? genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      safetySettings,
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    })
  : null;

// Vision model – same model handles vision in Gemini 2.0
export const geminiVision = genAI
  ? genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      safetySettings,
      generationConfig: {
        temperature: 0.4,
        topK: 32,
        topP: 0.95,
        maxOutputTokens: 4096,
      },
    })
  : null;

export default genAI;
