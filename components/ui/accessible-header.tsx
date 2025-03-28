"use client";

import { AccessibleNav } from "@/components/ui/accessible-nav";
import { SkipLink } from "@/components/ui/skip-link";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";

interface HeaderProps {
  className?: string;
}

const navItems = [
  { href: "/", label: "Home", description: "Return to homepage" },
  { href: "/blog", label: "Blog", description: "Read my latest articles" },
  {
    href: "/tools",
    label: "Tools",
    description: "Explore my Amazon seller tools",
  },
  { href: "/about", label: "About", description: "Learn more about me" },
];

export function AccessibleHeader({ className }: HeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className,
      )}
    >
      <SkipLink />
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6 md:gap-8">
          <a
            href="/"
            className="flex items-center space-x-2 font-bold"
            aria-label="Wesley Quintero"
          >
            <span className="hidden sm:inline-block">Wesley Quintero</span>
          </a>
          <AccessibleNav items={navItems} className="hidden md:block" />
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
