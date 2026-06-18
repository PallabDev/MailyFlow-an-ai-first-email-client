import FolderPageClient from '@/features/email/components/FolderPageClient';

export default function SpamPage() {
  return (
    <FolderPageClient
      initialEmails={[]}
      initialNextPageToken={null}
      folder="spam"
      title="Spam"
      emailError={null}
    />
  );
}
