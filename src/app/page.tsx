'use client';

import AboutSection from '@/components/about-section';
import BlogSection from '@/components/blog-section';
import CertificationsSection from '@/components/certifications-section';
import ContactSection from '@/components/contact-section';
import FeaturedToolsSection from '@/components/featured-tools-section';
import Footer from '@/components/footer';
import Header from '@/components/header';
import HeroSection from '@/components/hero-section';
import ProjectsSection from '@/components/projects-section';
import { ErrorBoundary } from '@/components/ui/error-boundary';
console.log('AboutSection:', AboutSection);
console.log('BlogSection:', BlogSection);
console.log('CertificationsSection:', CertificationsSection);
console.log('ContactSection:', ContactSection);
console.log('FeaturedToolsSection:', FeaturedToolsSection);
console.log('Footer:', Footer);
console.log('Header:', Header);
console.log('HeroSection:', HeroSection);
console.log('ProjectsSection:', ProjectsSection);
console.log('ErrorBoundary:', ErrorBoundary);

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
