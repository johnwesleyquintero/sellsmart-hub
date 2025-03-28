import AboutSection from "@/components/about-section";
import BlogSection from "@/components/blog-section";
import CertificationsSection from "@/components/certifications-section";
import ContactSection from "@/components/contact-section";
import ErrorBoundary from "@/components/enhanced-error-boundary";
import FeaturedToolsSection from "@/components/featured-tools-section";
import Footer from "@/components/footer";
import Header from "@/components/header";
import HeroSection from "@/components/hero-section";
import ProjectsSection from "@/components/projects-section";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Amazon Seller Tools & Development Solutions",
  description:
    "Professional Amazon seller tools and development solutions to optimize your business performance",
  openGraph: {
    title: "Amazon Seller Tools & Development Solutions",
    description:
      "Optimize your Amazon business with our comprehensive suite of tools",
    images: ["/og-image.png"],
  },
};

export default function Home() {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 dark:from-purple-500/10 dark:to-blue-500/10" />
      </div>
      <div className="relative">
        <Header />
        <ErrorBoundary>
          <HeroSection />
          <ProjectsSection />
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/80 to-transparent" />
            <FeaturedToolsSection />
          </div>
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
