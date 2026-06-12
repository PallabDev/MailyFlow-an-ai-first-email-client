import FolderPageClient from '../_components/FolderPageClient';

export default function DraftPage() {
  return (
    <FolderPageClient
      initialEmails={[]}
      initialNextPageToken={null}
      folder="drafts"
      title="Drafts"
      emailError={null}
    />
  );
}
