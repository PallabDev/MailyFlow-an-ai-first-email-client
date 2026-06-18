import FolderPageClient from '@/features/email/components/FolderPageClient';

export default function StarredPage() {
  return (
    <FolderPageClient
      initialEmails={[]}
      initialNextPageToken={null}
      folder="starred"
      title="Starred"
      emailError={null}
    />
  );
}
