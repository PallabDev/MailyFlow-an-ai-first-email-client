import { z } from 'zod';

export const chatMessageSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    })
  ),
  timezone: z.string().optional(),
  localTime: z.string().optional(),
});

export const envSchema = z.object({
  ProjectName: z.string().default('MailyFlow'),
  CORSAIR_KEK: z.string().min(1, 'CORSAIR_KEK environment variable is required'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL environment variable is required'),
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY environment variable is required'),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1, 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY environment variable is required'),
  CLERK_SECRET_KEY: z.string().min(1, 'CLERK_SECRET_KEY environment variable is required'),
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().default('/sign-in'),
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().default('/sign-up'),
  INNGEST_EVENT_KEY: z.string().min(1, 'INNGEST_EVENT_KEY environment variable is required'),
  INNGEST_SIGNING_KEY: z.string().min(1, 'INNGEST_SIGNING_KEY environment variable is required'),
  NEXT_PUBLIC_APP_URL: z.string().min(1, 'NEXT_PUBLIC_APP_URL environment variable is required'),
  TOPIC_ID: z.string().min(1, 'TOPIC_ID environment variable is required'),
  GOOGLE_CLIENT_ID: z.string().min(1, 'GOOGLE_CLIENT_ID environment variable is required'),
  GOOGLE_CLIENT_SECRET: z.string().min(1, 'GOOGLE_CLIENT_SECRET environment variable is required'),
  RAZORPAY_KEY_ID: z.string().min(1, 'RAZORPAY_KEY_ID environment variable is required'),
  RAZORPAY_KEY_SECRET: z.string().min(1, 'RAZORPAY_KEY_SECRET environment variable is required'),
});

export function validateEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const details = JSON.stringify(result.error.format(), null, 2);
    console.error('❌ Environment validation failed:', details);
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Invalid environment configuration: ${details}`);
    }
  }
  return result.data;
}
