import OpenAI from 'openai';

// Create OpenAI client instance pointing to the custom base URL and API key
export const openai = new OpenAI({
  baseURL: 'https://api.aicredits.in/v1',
  apiKey: process.env.OPENAI_API_KEY || '',
});

// Default AI model config used across agents and chat systems
export const AI_MODEL = process.env.NEXT_PUBLIC_AI_MODEL || 'gpt-5-mini';
