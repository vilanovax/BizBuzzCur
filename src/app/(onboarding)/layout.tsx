import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check if user is authenticated
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {children}
    </div>
  );
}
