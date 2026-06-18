export const APP_CONFIG = {
  name: process.env.ProjectName || 'MailyFlow',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  isProduction: process.env.NODE_ENV === 'production',
} as const;
