import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Landing from '../screens/Landing';
import { ThemeProvider } from '../theme';

export default async function Home() {
  const { userId } = await auth();
  if (userId) {
    redirect('/dashboard');
  }

  return (
    <ThemeProvider>
      <Landing />
    </ThemeProvider>
  );
}
