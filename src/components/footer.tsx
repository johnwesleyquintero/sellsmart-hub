import Link from 'next/link';
import { Github, Linkedin, Twitter, Mail, Triangle } from 'lucide-react';
import Logo from '@/components/Logo';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/40">
      <div className="container py-8 md:py:12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <Logo className="h-8 w-8" />
              <h3 className="text-lg font-semibold">Wesley Quintero</h3>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Data-Driven Amazon & E-commerce Specialist helping brands scale
              with insights, automation, and AI.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Quick Links</h3>
            <ul className="mt-2 space-y-2 text-sm">
              <li>
                <Link
                  href="#projects"
                  className="text-muted-foreground hover:text-primary"
                >
                  Projects
                </Link>
              </li>
              <li>
                <Link
                  href="#about"
                  className="text-muted-foreground hover:text-primary"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href="#blog"
                  className="text-muted-foreground hover:text-primary"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="#contact"
                  className="text-muted-foreground hover:text-primary"
                >
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="https://sellsmart-hub.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary"
                >
                  SellSmart Hub
                </Link>
              </li>
              <li>
                <Link
                  href="https://sellsmart-pro.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary"
                >
                  SellSmart Pro
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Connect</h3>
            <div className="mt-2 flex space-x-4">
              <Link
                href="https://github.com/johnwesleyquintero"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="rounded-full bg-background p-2 text-muted-foreground transition-all hover:text-primary hover:scale-110 hover:shadow-lg hover:shadow-primary/20 duration-300 hover:bg-primary/10 group hover:rotate-6"
              >
                <Github className="h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
              </Link>
              <Link
                href="https://linkedin.com/in/wesleyquintero"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="rounded-full bg-background p-2 text-muted-foreground transition-all hover:text-primary hover:scale-110 hover:shadow-lg hover:shadow-primary/20 duration-300 hover:bg-primary/10 hover:rotate-6 group"
              >
                <Linkedin className="h-5 w-5" />
              </Link>
              <Link
                href="https://twitter.com/wesleyquintero"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter"
                className="rounded-full bg-background p-2 text-muted-foreground transition-all hover:text-primary hover:scale-110 hover:shadow-lg hover:shadow-primary/20 duration-300 hover:bg-primary/10 hover:rotate-6 group"
              >
                <Twitter className="h-5 w-5" />
              </Link>
              <Link
                href="mailto:johnwesleyquintero@gmail.com"
                aria-label="Email"
                className="rounded-full bg-background p-2 text-muted-foreground transition-all hover:text-primary hover:scale-110 hover:shadow-lg hover:shadow-primary/20 duration-300 hover:bg-primary/10 hover:rotate-6 group"
              >
                <Mail className="h-5 w-5" />
              </Link>
              <Link
                href="https://sellsmart-pro.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="SellSmart Pro"
                className="rounded-full bg-background p-2 text-muted-foreground transition-all hover:text-primary hover:scale-110 hover:shadow-lg hover:shadow-primary/20 duration-300 hover:bg-primary/10 group hover:rotate-6"
              >
                <Triangle className="h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t pt-6">
          <p className="text-center text-sm text-muted-foreground">
            &copy; {currentYear} Wesley Quintero. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
