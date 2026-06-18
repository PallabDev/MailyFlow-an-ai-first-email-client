import FolderPageClient from '@/features/email/components/FolderPageClient';

export default function SentPage() {
  return (
    <FolderPageClient
      initialEmails={[]}
      initialNextPageToken={null}
      folder="sent"
      title="Sent Messages"
      emailError={null}
    />
  );
}
