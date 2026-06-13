import { serve } from 'inngest/next';
import { inngest } from '@/inngest/client';
import { processAICall } from '@/inngest/functions';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [processAICall],
});
