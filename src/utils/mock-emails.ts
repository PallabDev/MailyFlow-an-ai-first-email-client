import { EmailItem } from '@/app/api/emails/_types';

export const MOCK_EMAILS: EmailItem[] = [
  {
    id: 'mock-1',
    from: 'MailyFlow Team <welcome@mailyflow.in>',
    date: new Date().toUTCString(),
    subject: 'Welcome to MailyFlow! 🚀',
    snippet: 'We are thrilled to have you here. MailyFlow is your AI-first email client designed to supercharge your productivity.',
    body: `Welcome to MailyFlow!

This is a mock email showing you how your inbox will look once you connect your Gmail account.

To get started:
1. Go to the Onboarding page (click the settings gear or navigate to the connection manager).
2. Click "Connect Gmail" to grant access.
3. Authorize MailyFlow to read your emails securely.

Once connected, your real-time email feed will sync automatically, and our live EventSource subscription will reload new emails without you needing to refresh the page.

Enjoy a faster, smarter inbox!

Best,
The MailyFlow Team`,
    labelIds: ['INBOX', 'UNREAD'],
  },
  {
    id: 'mock-2',
    from: 'AI Copilot <copilot@mailyflow.in>',
    date: new Date(Date.now() - 3600 * 1000).toUTCString(),
    subject: 'Summarize your threads with AI 🧠',
    snippet: 'Did you know you can use the AI assistant sidebar to draft responses, summarize threads, and organize your inbox?',
    body: `Hi there,

I am your AI Copilot. You can ask me to write replies, explain long threads, or search for information in your inbox.

Give it a try in the AIAssistant sidebar on the right!

Cheers,
Your Copilot`,
    labelIds: ['INBOX', 'UNREAD'],
  }
];
