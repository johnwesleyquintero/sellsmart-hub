
import React, { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import Services from '@/components/Services';
import CaseStudies from '@/components/CaseStudies';
import FreeTools from '@/components/FreeTools';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';

const Index = () => {
  useEffect(() => {
    const handleAnimateOnScroll = () => {
      const elements = document.querySelectorAll('.animate-on-scroll');
      
      elements.forEach(element => {
        const elementTop = element.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        
        if (elementTop < windowHeight * 0.9) {
          element.classList.add('animate-visible');
        }
      });
    };
    
    // Initialize animation on load
    handleAnimateOnScroll();
    
    // Add scroll event listener
    window.addEventListener('scroll', handleAnimateOnScroll);
    
    return () => {
      window.removeEventListener('scroll', handleAnimateOnScroll);
    };
  }, []);

  return (
    <main className="relative overflow-hidden">
      <Navbar />
      <Hero />
      <Services />
      <CaseStudies />
      <FreeTools />
      <Contact />
      <Footer />
    </main>
  );
};

export default Index;
