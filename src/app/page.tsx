'use client';

import dynamic from 'next/dynamic';
import Header from '@/components/header';
import Footer from '@/components/footer';

const ErrorBoundary = dynamic(() => import('@/components/ui/error-boundary'), {
  ssr: false,
  loading: () => <div className="min-h-[400px]" />,
});

// Dynamically import sections that might use browser APIs
const HeroSection = dynamic(() => import('@/components/hero-section'), {
  ssr: false,
});
const FeaturedToolsSection = dynamic(
  () => import('@/components/featured-tools-section'),
  { ssr: false },
);
const ProjectsSection = dynamic(() => import('@/components/projects-section'), {
  ssr: false,
});
const AboutSection = dynamic(() => import('@/components/about-section'), {
  ssr: false,
});
const CertificationsSection = dynamic(
  () => import('@/components/certifications-section'),
  { ssr: false },
);
const BlogSection = dynamic(() => import('@/components/blog-section'), {
  ssr: false,
});
const ContactSection = dynamic(() => import('@/components/contact-section'), {
  ssr: false,
});

export default function Home() {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      <div className="relative">
        <Header />
        <ErrorBoundary>
          <HeroSection />
          <FeaturedToolsSection />
          <ProjectsSection />
          <AboutSection />
          <CertificationsSection />
          <BlogSection />
          <ContactSection />
        </ErrorBoundary>
        <Footer />
      </div>
    </div>
  );
}
