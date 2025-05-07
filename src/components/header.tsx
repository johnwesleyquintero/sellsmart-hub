'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { FileText, Loader2, Menu, Moon, Sun, X } from 'lucide-react';
import { signIn, signOut, useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useExport } from './header/use-export';
import { useHeaderData } from './header/use-header-data';

export default function Header() {
  const { data: session, status } = useSession(); // Get session data and status using next-auth
  const {
    query,
    setQuery,
    debouncedQuery,
    isSearchOpen,
    setIsSearchOpen,
    searchHistory,
    setSearchHistory,
    isMenuOpen,
    setIsMenuOpen,
  } = useHeaderData(); // Custom hook for managing header state (search, menu)
  const { isDownloading, handleExportClick } = useExport();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data, isLoading } = useQuery({
    // Fetch search results using react-query
    queryKey: ['search', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery) return { blog: [], tools: [] }; // Return empty results if no query
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(debouncedQuery)}`,
      );
      if (!response.ok) throw new Error('Search failed');
      return await response.json();
    },
    enabled: !!debouncedQuery,
  });

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    if (searchQuery && !searchHistory.includes(searchQuery)) {
      const newSearchHistory = [searchQuery, ...searchHistory];
      if (newSearchHistory.length > 5) {
        newSearchHistory.pop();
      }
      setSearchHistory(newSearchHistory);
    }
  };

  const toggleMenu = () => {
    // Function to toggle the mobile menu
    setIsMenuOpen(!isMenuOpen);
  };

  const navItems = [
    { name: 'Home', href: '#hero' },
    { name: 'Projects', href: '#projects' },
    { name: 'Tools', href: '#tools' },
    { name: 'About', href: '#about' },
    { name: 'Certifications', href: '#certifications' },
    { name: 'Blog', href: '#blog' },
    { name: 'Contact', href: '#contact' },
    {
      name: 'Platform',
      href: 'https://sellsmart-hub.vercel.app/',
      external: true,
    },
    {
      name: 'Resume',
      href: 'https://johnwesleyquintero-resume.netlify.app/',
      external: true,
    },
  ];

  return (
    <>
      {status === 'authenticated' || status === 'unauthenticated' ? ( // Conditionally render header based on authentication status
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/favicon.svg"
                alt="Site Logo"
                width={32}
                height={32}
              />
              <span className="text-xl font-bold">Wesley Quintero</span>
            </Link>

            <nav className="hidden md:flex md:gap-6 items-center">
              {navItems.map((item) =>
                item.external ? (
                  <a
                    key={item.href}
                    href={item.href}
                    className="text-sm font-medium transition-all duration-300 hover:text-primary relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {item.name}
                  </a>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-sm font-medium transition-all duration-300 hover:text-primary relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
                  >
                    {item.name}
                  </Link>
                ),
              )}
              {session ? (
                <Button
                  variant="ghost"
                  onClick={() => signOut()}
                  className="text-sm font-medium transition-all duration-300 hover:text-primary"
                >
                  Sign Out
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  onClick={() => signIn()}
                  className="text-sm font-medium transition-all duration-300 hover:text-primary"
                >
                  Sign In
                </Button>
              )}
            </nav>

            <div className="flex items-center gap-2">
              <div className="relative hidden md:block search-container">
                {' '}
                {/* Search input container */}
                <input
                  type="text"
                  placeholder="Search..."
                  value={query}
                  onChange={(e) => {
                    handleSearch(e.target.value);
                  }}
                  onFocus={() => {
                    setIsSearchOpen(true);
                  }}
                  className="h-9 w-48 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
                <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                  <span className="text-xs">⌘</span>K
                </kbd>
                {(query || isSearchOpen) && (
                  <div className="absolute top-full mt-2 w-full rounded-md border bg-popover p-2 shadow-md max-h-[300px] overflow-y-auto">
                    {!query && searchHistory.length > 0 && (
                      <div className="mb-4">
                        <div className="mb-2 text-sm font-medium text-muted-foreground">
                          Recent Searches
                        </div>
                        {searchHistory.map((item) => (
                          <button
                            key={item}
                            className="block w-full text-left px-2 py-1 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground"
                            onClick={() => {
                              handleSearch(item);
                            }}
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
                            <div className="mb-2 text-sm font-medium text-muted-foreground">
                              Blog Posts
                            </div>
                            {data.blog.map(
                              (item: { slug: string; title: string }) => (
                                <Link
                                  key={item.slug}
                                  href={`/blog/${item.slug}`}
                                  className={cn(
                                    'block px-2 py-1 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground',
                                  )}
                                  onClick={() => {
                                    setQuery('');
                                    setIsSearchOpen(false);
                                  }}
                                >
                                  {item.title}
                                </Link>
                              ),
                            )}
                          </div>
                        )}
                        {data.tools && data.tools.length > 0 && (
                          <div>
                            <div className="mb-2 text-sm font-medium text-muted-foreground">
                              Tools
                            </div>
                            {data.tools.map((item: { id: string }) => (
                              <Link
                                key={item.id}
                                href={`#${item.id}`}
                                className={cn(
                                  'block px-2 py-1 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground',
                                )}
                                onClick={() => {
                                  setQuery('');
                                  setIsSearchOpen(false);
                                }}
                              >
                                {item.id}
                              </Link>
                            ))}
                          </div>
                        )}
                        {!data.blog?.length && !data.tools?.length && (
                          <div className="text-sm text-muted-foreground text-center py-2">
                            No results found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {mounted && ( // Only render after component is mounted
                <>
                  <Button // Theme toggle button
                    variant="ghost"
                    size="icon"
                    aria-label="Toggle theme"
                    className="mr-2"
                    onClick={() => {
                      setTheme(theme === 'dark' ? 'light' : 'dark');
                    }}
                  >
                    {theme === 'dark' ? (
                      <Sun className="h-5 w-5" />
                    ) : (
                      <Moon className="h-5 w-5" />
                    )}
                  </Button>
                  <Button // Export as PDF button
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

              <Button // Mobile menu toggle button
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
                        onClick={() => {
                          setIsMenuOpen(false);
                        }}
                      >
                        {item.name}
                      </a>
                    ) : (
                      <Link
                        key={item.name}
                        href={item.href}
                        className="text-sm font-medium transition-all duration-300 hover:text-primary relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
                        onClick={() => {
                          setIsMenuOpen(false);
                        }}
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
      ) : null}
    </>
  );
}
