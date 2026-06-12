import FolderPageClient from '../_components/FolderPageClient';

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
