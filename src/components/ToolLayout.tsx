
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';

interface ToolLayoutProps {
  children: React.ReactNode;
  title: string;
  icon: React.ReactNode;
  description: string;
}

const ToolLayout = ({ children, title, icon, description }: ToolLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow pt-20 pb-16">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mb-8">
            <Button
              variant="ghost"
              size="sm"
              className="mb-4"
              asChild
            >
              <Link to="/" className="flex items-center text-muted-foreground hover:text-foreground">
                <ArrowLeft className="mr-1 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
            
            <div className="flex items-center gap-4 mb-2">
              <div className="p-2 rounded-lg bg-sellsmart-teal/10">
                <div className="text-sellsmart-teal">{icon}</div>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>
            </div>
            
            <p className="text-muted-foreground">{description}</p>
          </div>
          
          <div className="bg-white rounded-xl border border-border p-6 md:p-8 shadow-sm">
            {children}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ToolLayout;
