'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';
const testimonials = [
    {
        id: 1,
        name: 'Sarah Johnson',
        position: 'Product Manager at TechCorp',
        image: '/profile/sarah-johnson.jpg',
        content: "After implementing Wesley's automation tools, our profits increased by 42% in 3 months while reducing manual work by 60%. His data-driven approach transformed our Amazon business.",
        metrics: '42% profit increase | 60% time savings',
    },
    {
        id: 2,
        name: 'Michael Chen',
        position: 'CTO at StartupX',
        image: '/profile/michael-chen.jpg',
        content: "Wesley's AI-powered insights helped us optimize our PPC campaigns, reducing our ACoS from 35% to 22% while maintaining sales volume. His tools pay for themselves.",
        metrics: '37% lower ACoS | maintained sales',
    },
    {
        id: 3,
        name: 'Emily Rodriguez',
        position: 'Founder of DesignHub',
        image: '/profile/emily-rodriguez.jpg',
        content: "Our conversion rate jumped from 8% to 14% after using Wesley's listing optimization tools. His deep understanding of Amazon's algorithm is unmatched.",
        metrics: '75% conversion increase',
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
            }
            else if (window.innerWidth < 1024) {
                setItemsPerView(2);
            }
            else {
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
        }
        else {
            setCurrentIndex(0);
        }
    };
    const prevSlide = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
        else {
            setCurrentIndex(testimonials.length - itemsPerView);
        }
    };
    return (<section id="testimonials" className="py-20">
      <div className="container">
        <div className="mb-12 text-center">
          <h2 className="section-heading">Testimonials</h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            What clients and colleagues say about working with me.
          </p>
        </div>

        <div className="relative">
          <div className="flex space-x-6 overflow-hidden">
            {visibleTestimonials.map((testimonial) => (<Card key={testimonial.id} className="min-w-0 flex-1">
                <CardContent className="p-6">
                  <Quote className="mb-4 h-8 w-8 text-primary/40"/>
                  <p className="mb-6 text-muted-foreground">
                    {testimonial.content}
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 overflow-hidden rounded-full">
                      <Image src={testimonial.image || '/placeholder.svg'} alt={testimonial.name} width={200} height={200} className="h-full w-full object-cover"/>
                    </div>
                    <div>
                      <h4 className="font-semibold">{testimonial.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {testimonial.position}
                      </p>
                      {testimonial.metrics && (<p className="text-xs mt-1 text-primary">
                          {testimonial.metrics}
                        </p>)}
                    </div>
                  </div>
                </CardContent>
              </Card>))}
          </div>

          <div className="mt-8 flex justify-center gap-4">
            <Button variant="outline" size="icon" onClick={prevSlide} aria-label="Previous testimonial">
              <ChevronLeft className="h-4 w-4"/>
            </Button>
            <Button variant="outline" size="icon" onClick={nextSlide} aria-label="Next testimonial">
              <ChevronRight className="h-4 w-4"/>
            </Button>
          </div>
        </div>
      </div>
    </section>);
}
