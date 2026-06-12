import FolderPageClient from '../_components/FolderPageClient';

export default function TrashPage() {
  return (
    <FolderPageClient
      initialEmails={[]}
      initialNextPageToken={null}
      folder="trash"
      title="Trash"
      emailError={null}
    />
  );
}
