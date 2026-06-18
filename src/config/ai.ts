export const AI_CONFIG = {
  model: process.env.NEXT_PUBLIC_AI_MODEL || 'gpt-5-mini',
  baseURL: 'https://api.aicredits.in/v1',
} as const;
