import type React from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog | Wesley Quintero',
  description:
    'Insights and strategies for Amazon sellers and e-commerce businesses.',
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
