'use client';

import { ContentSkeleton } from '@/components/ui/loading-skeleton';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const UnifiedDashboard = dynamic(
  () => import('@/components/amazon-seller-tools/unified-dashboard'),
  {
    loading: () => <ContentSkeleton />,
    ssr: false,
  },
);

export default function DashboardWrapper() {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <UnifiedDashboard />
    </Suspense>
  );
}
