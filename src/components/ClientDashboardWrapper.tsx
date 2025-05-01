'use client';

import { ContentSkeleton } from '@/components/ui/loading-skeleton';
import { QueryErrorBoundary } from '@/components/ui/query-error-boundary';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const DashboardWrapper = dynamic(
  () => import('@/components/DashboardWrapper'),
  {
    loading: () => <ContentSkeleton />,
    ssr: false,
  },
);

const ClientDashboardWrapper = () => {
  return (
    <QueryErrorBoundary>
      <Suspense fallback={<ContentSkeleton />}>
        <DashboardWrapper />
      </Suspense>
    </QueryErrorBoundary>
  );
};

export default ClientDashboardWrapper;
