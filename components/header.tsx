'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Menu, X, FileText, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export default function Header() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);
    return () => clearTimeout(handler);
  }, [query]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery) return { blog: [], tools: [] };
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(debouncedQuery)}`,
      );
      if (!response.ok) throw new Error('Search failed');
      return await response.json();
    },
    enabled: !!debouncedQuery,
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleExportClick = async () => {
    try {
      setIsDownloading(true);
      const response = await fetch('/api/download');
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Wesley_Quintero_Resume.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download resume:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const navItems = [
    { name: 'Home', href: '#hero' },
    { name: 'Projects', href: '#projects' },
    { name: 'Tools', href: '#tools' },
    { name: 'About', href: '#about' },
    { name: 'Certifications', href: '#certifications' },
    { name: 'Blog', href: '#blog' },
    { name: 'Contact', href: '#contact' },
    // Add external link
    {
      name: 'SellSmart Pro',
      href: 'https://sellsmart-pro.vercel.app/',
      external: true,
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.svg"
              alt="Logo"
              className="h-8 w-8"
              width={32}
              height={32}
            />
            <span className="text-xl font-bold">Wesley Quintero</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex md:gap-6 items-center">
            {navItems.map((item) =>
              item.external ? (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-sm font-medium transition-all duration-300 hover:text-primary relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {item.name}
                </a>
              ) : (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-sm font-medium transition-all duration-300 hover:text-primary relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
                >
                  {item.name}
                </Link>
              ),
            )}
          </nav>

          <div className="flex items-center gap-2">
            <div className="relative hidden md:block">
              <input
                type="text"
                placeholder="Search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-9 w-48 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />

              <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                <span className="text-xs">⌘</span>K
              </kbd>
            </div>
            {mounted && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Toggle theme"
                  className="mr-2"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                >
                  {theme === 'dark' ? (
                    <Sun className="h-5 w-5" />
                  ) : (
                    <Moon className="h-5 w-5" />
                  )}
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
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={toggleMenu}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="absolute left-0 right-0 top-16 z-50 border-b bg-background/95 backdrop-blur-sm p-4 md:hidden animate-fadeIn">
              <nav className="flex flex-col space-y-4">
                {navItems.map((item) =>
                  item.external ? (
                    <a
                      key={item.name}
                      href={item.href}
                      className="text-sm font-medium transition-all duration-300 hover:text-primary relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.name}
                    </a>
                  ) : (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="text-sm font-medium transition-all duration-300 hover:text-primary relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ),
                )}
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Search Results Dropdown */}
      {(query || isSearchOpen) && (
        <div className="absolute top-full mt-2 w-full rounded-md border bg-popover p-2 shadow-md max-h-[300px] overflow-y-auto">
          {!query && searchHistory.length > 0 && (
            <div className="mb-4">
              <div className="mb-2 text-sm font-medium text-muted-foreground">Recent Searches</div>
              {searchHistory.map((item, index) => (
                <button
                  key={item}
                  className="block w-full text-left px-2 py-1 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground"
                  onClick={() => setQuery(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          )}
          {isLoading && (
            <div className="flex items-center justify-center py-2 text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>Searching...</span>
            </div>
          )}
          {!isLoading && data && (
            <div className="space-y-4">
              {data.blog && data.blog.length > 0 && (
                <div>
                  <div className="mb-2 text-sm font-medium text-muted-foreground">Blog Posts</div>
                  {data.blog.map((item, index) => (
                    <Link
                      key={item.slug}
                      href={`/blog/${item.slug}`}
                      className={cn(
                        'block px-2 py-1 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground',
                        selectedIndex === index ? 'bg-accent text-accent-foreground' : ''
                      )}
                      onClick={() => {
                        setQuery('');
                        setIsSearchOpen(false);
                      }}
                    >
                      {item.title}
                    </Link>
                  ))}
                </div>
              )}
              {data.tools && data.tools.length > 0 && (
                <div>
                  <div className="mb-2 text-sm font-medium text-muted-foreground">Tools</div>
                  {data.tools.map((item, index) => (
                    <Link
                      key={item.id}
                      href={`#${item.id}`}
                      className={cn(
                        'block px-2 py-1 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground',
                        selectedIndex === index + (data.blog?.length || 0) ? 'bg-accent text-accent-foreground' : ''
                      )}
                      onClick={() => {
                        setQuery('');
                        setIsSearchOpen(false);
                      }}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              )}
              {(!data.blog?.length && !data.tools?.length) && (
                <div className="text-sm text-muted-foreground text-center py-2">
                  No results found
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
