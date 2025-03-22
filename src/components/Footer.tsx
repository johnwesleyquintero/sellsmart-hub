
import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-border py-12">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <a href="#" className="inline-block mb-4">
              <span className="text-2xl font-bold bg-gradient-to-r from-sellsmart-blue via-sellsmart-purple to-sellsmart-teal bg-clip-text text-transparent">
                SellSmart
              </span>
            </a>
            <p className="text-muted-foreground text-sm mb-4">
              Your all-in-one Amazon agency dedicated to helping sellers succeed on the world's largest e-commerce platform.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Services</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-muted-foreground hover:text-sellsmart-blue transition-colors">Supplier Relationships</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-sellsmart-blue transition-colors">Product Sourcing</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-sellsmart-blue transition-colors">SEO & Optimization</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-sellsmart-blue transition-colors">PPC Advertising</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-sellsmart-blue transition-colors">Brand Building</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Free Tools</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-muted-foreground hover:text-sellsmart-blue transition-colors">Keyword Research</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-sellsmart-blue transition-colors">Inventory Tracker</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-sellsmart-blue transition-colors">Listing Optimization</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-sellsmart-blue transition-colors">PPC Campaign Audit</a></li>
              <li><a href="#" className="text-muted-foreground hover:text-sellsmart-blue transition-colors">Review Management</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="text-muted-foreground hover:text-sellsmart-blue transition-colors">Home</a></li>
              <li><a href="#services" className="text-muted-foreground hover:text-sellsmart-blue transition-colors">Services</a></li>
              <li><a href="#case-studies" className="text-muted-foreground hover:text-sellsmart-blue transition-colors">Case Studies</a></li>
              <li><a href="#free-tools" className="text-muted-foreground hover:text-sellsmart-blue transition-colors">Free Tools</a></li>
              <li><a href="#contact" className="text-muted-foreground hover:text-sellsmart-blue transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-border mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} SellSmart. All rights reserved.
          </p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <a href="#" className="text-muted-foreground hover:text-sellsmart-blue transition-colors text-sm">Privacy Policy</a>
            <a href="#" className="text-muted-foreground hover:text-sellsmart-blue transition-colors text-sm">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
