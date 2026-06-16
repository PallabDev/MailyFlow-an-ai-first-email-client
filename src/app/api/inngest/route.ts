import { serve } from 'inngest/next';
import { inngest } from '@/inngest/client';
import { processAICall, trackFailedAICalls, syncGmailWebhook } from '@/inngest/functions';

export const maxDuration = 300; // Allow functions to run up to 5 minutes on serverless hosts

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [processAICall, trackFailedAICalls, syncGmailWebhook],
  streaming: true, // Bypass connection timeouts on serverless hosts
});
