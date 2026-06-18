import FolderPageClient from '@/features/email/components/FolderPageClient';

export default function InboxPage() {
  return (
    <FolderPageClient
      initialEmails={[]}
      initialNextPageToken={null}
      folder="inbox"
      title="Inbox"
      emailError={null}
    />
  );
}
