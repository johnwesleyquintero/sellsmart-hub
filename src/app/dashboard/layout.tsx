'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { AuthDisplay } from './auth-display';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useSession();

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    redirect('/api/auth/signin');
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AuthDisplay />
        {children}
      </main>
    </div>
  );
}
