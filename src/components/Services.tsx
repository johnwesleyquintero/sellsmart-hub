
import React, { useEffect, useRef } from 'react';
import { Search, Package, BarChart3, Zap, Target, Users } from 'lucide-react';

const services = [
  {
    icon: <Users className="h-10 w-10 text-sellsmart-blue" />,
    title: 'Supplier and Brand Relationships',
    description: 'Build strong, profitable relationships with suppliers and brands to ensure quality products and competitive pricing.'
  },
  {
    icon: <Package className="h-10 w-10 text-sellsmart-purple" />,
    title: 'Product Sourcing & Catalog Building',
    description: 'Identify profitable products and build optimized catalogs to maximize your market reach and sales potential.'
  },
  {
    icon: <Search className="h-10 w-10 text-sellsmart-teal" />,
    title: 'SEO & Listing Optimization',
    description: 'Optimize your product listings with targeted keywords and compelling content to improve visibility and conversions.'
  },
  {
    icon: <BarChart3 className="h-10 w-10 text-sellsmart-blue" />,
    title: 'PPC Advertising & Bidding',
    description: 'Create and manage effective PPC campaigns to drive targeted traffic to your listings and maximize ROI.'
  },
  {
    icon: <Target className="h-10 w-10 text-sellsmart-purple" />,
    title: 'Brand Building & Marketing',
    description: 'Develop a strong brand identity and implement marketing strategies to build customer loyalty and trust.'
  },
  {
    icon: <Zap className="h-10 w-10 text-sellsmart-teal" />,
    title: 'Operational Support',
    description: 'Streamline your operations with inventory management, logistics support, and compliance assistance.'
  }
];

const Services = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

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

    if (sectionRef.current) {
      sectionRef.current.querySelectorAll('.animate-on-scroll').forEach(el => {
        observer.observe(el);
      });
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section 
      id="services" 
      ref={sectionRef}
      className="section-padding bg-gradient-to-b from-white to-sellsmart-blue/5"
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16 animate-on-scroll transform translate-y-4">
          <div className="inline-block px-3 py-1 rounded-full bg-sellsmart-blue/10 text-sellsmart-blue text-sm font-medium mb-4">
            Our Services
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Comprehensive Amazon Seller Solutions
          </h2>
          <p className="text-muted-foreground">
            Leverage our expertise and tools to optimize every aspect of your Amazon business
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div
              key={index}
              ref={el => cardRefs.current[index] = el}
              className="glass-card p-8 animate-on-scroll transform translate-y-4"
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="mb-6">{service.icon}</div>
              <h3 className="text-xl font-semibold mb-3">{service.title}</h3>
              <p className="text-muted-foreground">{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
