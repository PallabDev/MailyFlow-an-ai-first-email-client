import FolderPageClient from '@/features/email/components/FolderPageClient';

export default function PromotionsPage() {
  return (
    <FolderPageClient
      initialEmails={[]}
      initialNextPageToken={null}
      folder="promotions"
      title="Promotions"
      emailError={null}
    />
  );
}
