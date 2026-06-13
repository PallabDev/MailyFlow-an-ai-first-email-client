import OpenAI from 'openai';

// Create OpenAI client instance pointing to the custom base URL and API key
export const openai = new OpenAI({
  baseURL: 'https://api.aicredits.in/v1',
  apiKey: process.env.AI_KEY || '',
});
