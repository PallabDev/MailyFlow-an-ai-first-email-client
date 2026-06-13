import { z } from 'zod';

export const chatMessageSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string().min(1),
    })
  ),
  timezone: z.string().optional(),
  localTime: z.string().optional(),
});

export const envSchema = z.object({
  ProjectName: z.string().default('MailyFlow'),
  AI_KEY: z.string().min(1, 'AI_KEY environment variable is required'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL environment variable is required'),
  CORSAIR_KEK: z.string().min(1, 'CORSAIR_KEK environment variable is required'),
});

export function validateEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Environment validation failed:', result.error.format());
    throw new Error('Invalid environment configuration');
  }
  return result.data;
}
