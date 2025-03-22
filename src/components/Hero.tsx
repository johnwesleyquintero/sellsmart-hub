
import React, { useEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Hero = () => {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -10% 0px'
    };

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-visible');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    if (titleRef.current) {
      titleRef.current.classList.add('animate-on-scroll', 'transform', 'translate-y-4');
      observer.observe(titleRef.current);
    }

    if (descriptionRef.current) {
      descriptionRef.current.classList.add('animate-on-scroll', 'transform', 'translate-y-4');
      observer.observe(descriptionRef.current);
    }

    if (ctaRef.current) {
      ctaRef.current.classList.add('animate-on-scroll', 'transform', 'translate-y-4');
      observer.observe(ctaRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-sellsmart-blue/5 to-transparent pointer-events-none"></div>
      
      {/* Background elements */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-sellsmart-purple/10 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-sellsmart-blue/10 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto px-4 md:px-6 py-24 md:py-32 relative z-10">
        <div className="max-w-3xl mx-auto text-center space-y-6 md:space-y-8">
          <div className="inline-block px-3 py-1 rounded-full bg-sellsmart-blue/10 text-sellsmart-blue text-sm font-medium mb-4 animate-fade-in">
            Amazon Seller Agency Framework
          </div>
          
          <h1 
            ref={titleRef}
            className="text-4xl md:text-6xl font-bold tracking-tight"
          >
            Elevate Your Amazon Business with{' '}
            <span className="text-sellsmart-blue">
              SellSmart
            </span>
          </h1>
          
          <p 
            ref={descriptionRef}
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            Your all-in-one solution for Amazon success. We combine powerful tools, expert strategies, and seamless automation to help you scale your business.
          </p>
          
          <div ref={ctaRef} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button 
              size="lg" 
              className="bg-sellsmart-blue hover:bg-sellsmart-blue/90 text-white rounded-full px-8 h-12"
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="rounded-full px-8 h-12"
            >
              Explore Free Tools
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mouse scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center animate-pulse">
        <div className="w-8 h-12 border-2 border-gray-300 rounded-full flex justify-center pt-1">
          <div className="w-1 h-2 bg-gray-300 rounded-full animate-bounce"></div>
        </div>
        <span className="text-xs text-gray-400 mt-2">Scroll Down</span>
      </div>
    </section>
  );
};

export default Hero;
