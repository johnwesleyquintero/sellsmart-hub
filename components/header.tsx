"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Moon, Sun, Menu, X, FileText, Loader2 } from "lucide-react"
import jsPDF from 'jspdf';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const handleExportClick = async () => {
    try {
      setIsDownloading(true)
      const response = await fetch('/api/download')
      if (!response.ok) throw new Error('Download failed')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'Wesley_Quintero_Resume.pdf'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Failed to download resume:', error)
    } finally {
      setIsDownloading(false)
    }
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
        <nav className="hidden md:flex md:gap-6 items-center">
          {navItems.map((item) => (
            item.external ? (
              <a key={item.name} href={item.href} className="text-sm font-medium transition-all duration-300 hover:text-primary relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full" target="_blank" rel="noopener noreferrer">
                {item.name}
              </a>
            ) : (
              <Link key={item.name} href={item.href} className="text-sm font-medium transition-all duration-300 hover:text-primary relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full">
                {item.name}
              </Link>
            )
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {mounted && (
            <>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Toggle theme"
                className="mr-2"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Export as PDF"
                className="mr-2"
                onClick={handleExportClick}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <FileText className="h-5 w-5" />
                )}
              </Button>
            </>
          )}

          {/* Mobile Menu Button */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleMenu} aria-label="Toggle menu">
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="absolute left-0 right-0 top-16 z-50 border-b bg-background/95 backdrop-blur-sm p-4 md:hidden animate-fadeIn">
            <nav className="flex flex-col space-y-4">
              {navItems.map((item) => (
                item.external ? (
                  <a key={item.name} href={item.href} className="text-sm font-medium transition-all duration-300 hover:text-primary relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full" target="_blank" rel="noopener noreferrer" onClick={() => setIsMenuOpen(false)}>
                    {item.name}
                  </a>
                ) : (
                  <Link key={item.name} href={item.href} className="text-sm font-medium transition-all duration-300 hover:text-primary relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full" onClick={() => setIsMenuOpen(false)}>
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

