'use client';

import { AuthDisplay } from './auth-display';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AuthDisplay />
        {children}
      </main>
    </div>
  );
}
