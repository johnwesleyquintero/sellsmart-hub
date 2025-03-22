
import React, { useEffect, useRef } from 'react';
import { Search, Package, FileText, Target, MessageCircle, BarChart3, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const tools = [
  {
    icon: <Search className="h-8 w-8" />,
    title: 'Keyword Research Tool',
    description: 'Identify high-volume, relevant keywords to optimize your product listings.',
    page: 'listings'
  },
  {
    icon: <Package className="h-8 w-8" />,
    title: 'Inventory Tracker',
    description: 'Track inventory levels and receive alerts for low stock and restocking needs.',
    page: 'inventory'
  },
  {
    icon: <FileText className="h-8 w-8" />,
    title: 'Listing Optimization Checker',
    description: 'Analyze your product listings and receive optimization suggestions.',
    page: 'listings'
  },
  {
    icon: <Target className="h-8 w-8" />,
    title: 'PPC Campaign Audit',
    description: 'Get insights into your PPC campaign performance and recommendations for improvement.',
    page: 'ppc'
  },
  {
    icon: <MessageCircle className="h-8 w-8" />,
    title: 'Review Management Tool',
    description: 'Monitor and respond to customer reviews to build social proof and improve visibility.',
    page: 'reviews'
  },
  {
    icon: <BarChart3 className="h-8 w-8" />,
    title: 'Sales Analytics Dashboard',
    description: 'Access basic sales analytics and trends to inform your business decisions.',
    page: 'analytics'
  }
];

const FreeTools = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const toolRefs = useRef<(HTMLDivElement | null)[]>([]);

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

    if (headerRef.current) {
      headerRef.current.classList.add('animate-on-scroll', 'transform', 'translate-y-4');
      observer.observe(headerRef.current);
    }

    toolRefs.current.forEach(ref => {
      if (ref) {
        ref.classList.add('animate-on-scroll', 'transform', 'translate-y-4');
        observer.observe(ref);
      }
    });

    return () => observer.disconnect();
  }, []);

  return (
    <section 
      id="free-tools" 
      ref={sectionRef}
      className="section-padding bg-gradient-to-b from-white to-sellsmart-teal/5"
    >
      <div className="container mx-auto px-4 md:px-6">
        <div ref={headerRef} className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-block px-3 py-1 rounded-full bg-sellsmart-teal/10 text-sellsmart-teal text-sm font-medium mb-4">
            Free Resources
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Powerful Free Tools for Sellers
          </h2>
          <p className="text-muted-foreground">
            Try our free tools and experience the power of our premium solutions
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool, index) => (
            <div
              key={index}
              ref={el => toolRefs.current[index] = el}
              className="p-6 rounded-2xl border border-border hover:border-sellsmart-teal/20 bg-white hover:shadow-subtle transition-all duration-300"
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="mb-4 p-2 inline-block rounded-lg bg-sellsmart-teal/10">
                <div className="text-sellsmart-teal">{tool.icon}</div>
              </div>
              <h3 className="text-lg font-semibold mb-2">{tool.title}</h3>
              <p className="text-muted-foreground text-sm mb-4">{tool.description}</p>
              <Button 
                variant="ghost" 
                className="text-sellsmart-teal hover:text-sellsmart-teal/90 hover:bg-sellsmart-teal/10 p-0 h-auto font-medium flex items-center"
              >
                <span>Try for free</span>
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FreeTools;
