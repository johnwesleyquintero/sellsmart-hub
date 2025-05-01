import ClientChatWrapper from '@/components/client-chat-wrapper';
import ClientDashboardWrapper from '@/components/ClientDashboardWrapper';
import Footer from '@/components/footer';
import Header from '@/components/header';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { ContentSkeleton } from '@/components/ui/loading-skeleton';
import { QueryErrorBoundary } from '@/components/ui/query-error-boundary';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Prioritize above-the-fold content
const HeroSection = dynamic(() => import('@/components/hero-section'), {
  loading: () => <ContentSkeleton />,
});

// Lazy load below-the-fold content

const ProjectsSection = dynamic(() => import('@/components/projects-section'), {
  loading: () => <ContentSkeleton />,
});

const AboutSection = dynamic(() => import('@/components/about-section'), {
  loading: () => <ContentSkeleton />,
});

const CertificationsSection = dynamic(
  () => import('@/components/certifications-section'),
  {
    loading: () => <ContentSkeleton />,
  },
);

const BlogSection = dynamic(() => import('@/components/blog-section'), {
  loading: () => <ContentSkeleton />,
});

const ContactSection = dynamic(() => import('@/components/contact-section'), {
  loading: () => <ContentSkeleton />,
});

export default function Home() {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <div className="relative">
        <Header />
        <ErrorBoundary>
          <Suspense fallback={<ContentSkeleton />}>
            <HeroSection />
          </Suspense>

          <ClientDashboardWrapper />

          <QueryErrorBoundary>
            <Suspense fallback={<ContentSkeleton />}>
              <ProjectsSection />
            </Suspense>
          </QueryErrorBoundary>

          <QueryErrorBoundary>
            <Suspense fallback={<ContentSkeleton />}>
              <AboutSection />
            </Suspense>
          </QueryErrorBoundary>

          <Suspense fallback={<ContentSkeleton />}>
            <CertificationsSection />
          </Suspense>

          <QueryErrorBoundary>
            <Suspense fallback={<ContentSkeleton />}>
              <BlogSection />
            </Suspense>
          </QueryErrorBoundary>

          <Suspense fallback={<ContentSkeleton />}>
            <ContactSection />
          </Suspense>

          {/* Add the client-side chat interface */}
          <ClientChatWrapper />
        </ErrorBoundary>
        <Footer />
      </div>
    </div>
  );
}
