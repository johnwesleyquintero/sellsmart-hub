import Link from "next/link"
import { Github, Linkedin, Twitter, Mail } from "lucide-react"

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t bg-muted/40">
      <div className="container py-8 md:py:12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <img src="/logo.svg" alt="Logo" className="h-8 w-8" />
              <h3 className="text-lg font-semibold">Wesley Quintero</h3>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Data-Driven Amazon & E-commerce Specialist helping brands scale with insights, automation, and AI.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Quick Links</h3>
            <ul className="mt-2 space-y-2 text-sm">
              <li>
                <Link href="#projects" className="text-muted-foreground hover:text-primary">
                  Projects
                </Link>
              </li>
              <li>
                <Link href="#about" className="text-muted-foreground hover:text-primary">
                  About
                </Link>
              </li>
              <li>
                <Link href="#blog" className="text-muted-foreground hover:text-primary">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="#contact" className="text-muted-foreground hover:text-primary">
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="https://wesleyquintero.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary"
                >
                  Portfolio
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
                  href="https://sellsmart-docs.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary"
                >
                  Documentation
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
              >
                <Github className="h-5 w-5 text-muted-foreground hover:text-primary" />
              </Link>
              <Link
                href="https://linkedin.com/in/wesleyquintero"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5 text-muted-foreground hover:text-primary" />
              </Link>
              <Link
                href="https://twitter.com/wesleyquintero"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5 text-muted-foreground hover:text-primary" />
              </Link>
              <Link href="mailto:johnwesleyquintero@gmail.com" aria-label="Email">
                <Mail className="h-5 w-5 text-muted-foreground hover:text-primary" />
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
  )
}