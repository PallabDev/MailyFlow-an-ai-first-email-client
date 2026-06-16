import { notFound } from 'next/navigation';
import UserPlanEditor from '@/user_plan';

export const metadata = {
  title: 'MailyFlow - Plan Editor (Dev Only)',
};

export default function DevPage() {
  // Reject request in production
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }
  return <UserPlanEditor />;
}
