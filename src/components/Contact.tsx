
import React, { useEffect, useRef } from 'react';
import { Mail, Phone, MapPin, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const Contact = () => {
  const contactRef = useRef<HTMLElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const infoRef = useRef<HTMLDivElement>(null);

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

    if (formRef.current) {
      formRef.current.classList.add('animate-on-scroll', 'transform', 'translate-y-4');
      observer.observe(formRef.current);
    }

    if (infoRef.current) {
      infoRef.current.classList.add('animate-on-scroll', 'transform', 'translate-y-4');
      observer.observe(infoRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section 
      id="contact" 
      ref={contactRef}
      className="section-padding bg-gradient-to-b from-sellsmart-teal/5 to-white"
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-block px-3 py-1 rounded-full bg-sellsmart-dark/10 text-sellsmart-dark text-sm font-medium mb-4">
            Get In Touch
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Ready to Grow Your Amazon Business?
          </h2>
          <p className="text-muted-foreground">
            Contact us today to learn how SellSmart can help you succeed
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
          <div ref={formRef} className="glass-card p-8">
            <h3 className="text-xl font-semibold mb-6">Send us a message</h3>
            <form className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Name
                  </label>
                  <Input
                    id="name"
                    placeholder="Your name"
                    className="border-border focus:border-sellsmart-blue focus:ring-sellsmart-blue/20"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    className="border-border focus:border-sellsmart-blue focus:ring-sellsmart-blue/20"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="subject" className="text-sm font-medium">
                  Subject
                </label>
                <Input
                  id="subject"
                  placeholder="How can we help you?"
                  className="border-border focus:border-sellsmart-blue focus:ring-sellsmart-blue/20"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium">
                  Message
                </label>
                <Textarea
                  id="message"
                  placeholder="Your message..."
                  className="border-border focus:border-sellsmart-blue focus:ring-sellsmart-blue/20 min-h-[120px]"
                />
              </div>
              <Button 
                type="submit" 
                className="bg-sellsmart-blue hover:bg-sellsmart-blue/90 text-white w-full rounded-lg"
              >
                Send Message
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </div>

          <div ref={infoRef} className="flex flex-col justify-between">
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4">Contact Information</h3>
              <p className="text-muted-foreground mb-8">
                Feel free to reach out to us with any questions or inquiries. 
                We're here to help you succeed on Amazon.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="bg-sellsmart-blue/10 p-2 rounded-lg mr-4">
                    <Mail className="h-5 w-5 text-sellsmart-blue" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <a href="mailto:sellsmartdev@gmail.com" className="text-sellsmart-blue hover:underline">
                      sellsmartdev@gmail.com
                    </a>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-sellsmart-purple/10 p-2 rounded-lg mr-4">
                    <Phone className="h-5 w-5 text-sellsmart-purple" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <a href="tel:+11234567890" className="hover:text-sellsmart-purple transition-colors">
                      +1 (123) 456-7890
                    </a>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-sellsmart-teal/10 p-2 rounded-lg mr-4">
                    <MapPin className="h-5 w-5 text-sellsmart-teal" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Address</p>
                    <address className="not-italic">
                      123 Main Street, Suite 456<br />
                      Anytown, Country 12345
                    </address>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="glass-card p-6">
              <h4 className="font-semibold mb-2">Visit Our Website</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Explore our full range of services and resources on our website.
              </p>
              <a 
                href="http://https://sellsmart-hub.netlify.app" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sellsmart-blue hover:underline flex items-center"
              >
                https://sellsmart-hub.netlify.app
                <ArrowRight className="ml-1 h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
