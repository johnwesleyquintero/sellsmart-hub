
import React, { useEffect, useRef } from 'react';
import { TrendingDown, Clock, DollarSign, Package } from 'lucide-react';

const caseStudies = [
  {
    title: 'Inventory Optimization',
    challenge: '45-day inventory turnover',
    solution: 'Real-time tracking system',
    results: [
      { icon: <TrendingDown className="h-5 w-5" />, text: '38% reduction in stockouts' },
      { icon: <TrendingDown className="h-5 w-5 transform rotate-180" />, text: '22% improvement in inventory turnover' },
      { icon: <Package className="h-5 w-5" />, text: 'Automated restocking alerts' }
    ]
  },
  {
    title: 'API Integration Success',
    challenge: 'Manual order processing (2hrs/day)',
    solution: 'Automated order workflow system',
    results: [
      { icon: <Clock className="h-5 w-5" />, text: '90% reduction in processing time' },
      { icon: <DollarSign className="h-5 w-5" />, text: '$12k/year labor cost savings' },
      { icon: <Package className="h-5 w-5" />, text: '99.9% order accuracy rate' }
    ]
  }
];

const CaseStudies = () => {
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
      id="case-studies" 
      ref={sectionRef}
      className="section-padding bg-gradient-to-b from-sellsmart-blue/5 to-white"
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16 animate-on-scroll transform translate-y-4">
          <div className="inline-block px-3 py-1 rounded-full bg-sellsmart-purple/10 text-sellsmart-purple text-sm font-medium mb-4">
            Success Stories
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Real Results for Amazon Sellers
          </h2>
          <p className="text-muted-foreground">
            See how our solutions have transformed Amazon businesses
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-4xl mx-auto">
          {caseStudies.map((study, index) => (
            <div
              key={index}
              ref={el => cardRefs.current[index] = el}
              className="glass-card p-8 animate-on-scroll transform translate-y-4"
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              <div className="mb-6">
                <div className="inline-block p-3 rounded-full bg-sellsmart-blue/10">
                  {index === 0 ? 
                    <Package className="h-6 w-6 text-sellsmart-blue" /> : 
                    <Clock className="h-6 w-6 text-sellsmart-purple" />
                  }
                </div>
              </div>
              
              <h3 className="text-xl font-semibold mb-3">{study.title}</h3>
              
              <div className="space-y-4 mb-6">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Challenge:</div>
                  <div className="font-medium">{study.challenge}</div>
                </div>
                
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Solution:</div>
                  <div className="font-medium">{study.solution}</div>
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-3">Results:</div>
                <ul className="space-y-2">
                  {study.results.map((result, i) => (
                    <li key={i} className="flex items-center space-x-2">
                      <div className={`text-${index === 0 ? 'sellsmart-blue' : 'sellsmart-purple'}`}>
                        {result.icon}
                      </div>
                      <span>{result.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CaseStudies;
