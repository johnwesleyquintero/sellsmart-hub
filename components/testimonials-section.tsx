'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';

// Sample testimonials data
const testimonials = [
  {
    id: 1,
    name: 'Sarah Johnson',
    position: 'Product Manager at TechCorp',
    image: 'https://v0.dev/placeholder/user?name=SJ&bg=4f46e5',
    content:
      'Wesley is an exceptional developer who consistently delivers high-quality work...',
  },
  {
    id: 2,
    name: 'Michael Chen',
    position: 'CTO at StartupX',
    image: 'https://v0.dev/placeholder/user?name=MC&bg=2563eb',
    content:
      'Working with Wesley was a pleasure. His understanding of data analytics...',
  },
  {
    id: 3,
    name: 'Emily Rodriguez',
    position: 'Founder of DesignHub',
    image: 'https://v0.dev/placeholder/user?name=ER&bg=3b82f6',
    content:
      'Wesley transformed our analytics infrastructure with his exceptional development skills...',
  },
];

export default function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visibleTestimonials, setVisibleTestimonials] = useState([]);
  const [itemsPerView, setItemsPerView] = useState(3);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setItemsPerView(1);
      } else if (window.innerWidth < 1024) {
        setItemsPerView(2);
      } else {
        setItemsPerView(3);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const endIndex = currentIndex + itemsPerView;
    setVisibleTestimonials(testimonials.slice(currentIndex, endIndex));
  }, [currentIndex, itemsPerView]);

  const nextSlide = () => {
    if (currentIndex + itemsPerView < testimonials.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const prevSlide = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      setCurrentIndex(testimonials.length - itemsPerView);
    }
  };

  return (
    <section id="testimonials" className="py-20">
      <div className="container">
        <div className="mb-12 text-center">
          <h2 className="section-heading">Testimonials</h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            What clients and colleagues say about working with me.
          </p>
        </div>

        <div className="relative">
          <div className="flex space-x-6 overflow-hidden">
            {visibleTestimonials.map((testimonial) => (
              <Card key={testimonial.id} className="min-w-0 flex-1">
                <CardContent className="p-6">
                  <Quote className="mb-4 h-8 w-8 text-primary/40" />
                  <p className="mb-6 text-muted-foreground">
                    {testimonial.content}
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 overflow-hidden rounded-full">
                      <Image
                        src={testimonial.image || '/placeholder.svg'}
                        alt={testimonial.name}
                        width={200}
                        height={200}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="font-semibold">{testimonial.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {testimonial.position}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-8 flex justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={prevSlide}
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={nextSlide}
              aria-label="Next testimonial"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
