import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import React from 'react';
import ClientLayoutWrapper from './_components/ClientLayoutWrapper';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  const user = await currentUser();
  if (!user) {
    redirect('/sign-in');
  }

  const serializedUser = {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.emailAddresses[0]?.emailAddress || '',
    imageUrl: user.imageUrl,
  };

  return (
    <ClientLayoutWrapper user={serializedUser}>
      {children}
    </ClientLayoutWrapper>
  );
}
