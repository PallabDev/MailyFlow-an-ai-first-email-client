import FolderPageClient from '../_components/FolderPageClient';

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
