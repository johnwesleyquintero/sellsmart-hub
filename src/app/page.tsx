import AboutSection from '@/app/components/about-section';
import BlogSection from '@/app/components/blog-section';
import CertificationsSection from '@/app/components/certifications-section';
import ContactSection from '@/app/components/contact-section';
import ErrorBoundary from '@/app/components/error-boundary';
import FeaturedToolsSection from '@/app/components/featured-tools-section';
import Footer from '@/app/components/footer';
import Header from '@/app/components/header';
import HeroSection from '@/app/components/hero-section';
import ProjectsSection from '@/app/components/projects-section';

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
