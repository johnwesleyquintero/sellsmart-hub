"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Moon, Sun, Menu, X } from "lucide-react"

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const navItems = [
    { name: "Home", href: "#hero" },
    { name: "Projects", href: "#projects" },
    { name: "Tools", href: "#tools" },
    { name: "About", href: "#about" },
    { name: "Certifications", href: "#certifications" },
    { name: "Blog", href: "#blog" },
    { name: "Contact", href: "#contact" },
    // Add external link
    { name: "SellSmart Pro", href: "https://sellsmart-pro.vercel.app/", external: true },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.svg" alt="Logo" className="h-8 w-8" />
          <span className="text-xl font-bold">Wesley Quintero</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex md:gap-6">
          {navItems.map((item) => (
            item.external ? (
              <a key={item.name} href={item.href} className="text-sm font-medium transition-colors hover:text-primary" target="_blank" rel="noopener noreferrer">
                {item.name}
              </a>
            ) : (
              <Link key={item.name} href={item.href} className="text-sm font-medium transition-colors hover:text-primary">
                {item.name}
              </Link>
            )
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle theme"
              className="mr-2"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          )}

          {/* Mobile Menu Button */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleMenu} aria-label="Toggle menu">
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="absolute left-0 right-0 top-16 z-50 border-b bg-background p-4 md:hidden">
            <nav className="flex flex-col space-y-4">
              {navItems.map((item) => (
                item.external ? (
                  <a key={item.name} href={item.href} className="text-sm font-medium transition-colors hover:text-primary" target="_blank" rel="noopener noreferrer" onClick={() => setIsMenuOpen(false)}>
                    {item.name}
                  </a>
                ) : (
                  <Link key={item.name} href={item.href} className="text-sm font-medium transition-colors hover:text-primary" onClick={() => setIsMenuOpen(false)}>
                    {item.name}
                  </Link>
                )
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

