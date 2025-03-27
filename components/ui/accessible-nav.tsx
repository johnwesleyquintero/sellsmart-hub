'use client';

import { useKeyboardNavigation } from '@/hooks/use-keyboard-navigation';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';

interface NavItem {
  href: string;
  label: string;
  description?: string;
};

interface AccessibleNavProps {
  items: NavItem[];
  className?: string;
}

export function AccessibleNav({ items, className }: AccessibleNavProps) {
  const pathname = usePathname();
  const [activeIndex, setActiveIndex] = React.useState(-1);
  const navRef = React.useRef<HTMLUListElement>(null);

  useKeyboardNavigation({
    onArrowDown: () => {
      setActiveIndex((prev) => (prev + 1) % items.length);
    },
    onArrowUp: () => {
      setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
    },
    onEnter: () => {
      if (activeIndex >= 0 && activeIndex < items.length) {
        const link = navRef.current?.querySelector(
          `a[href="${items[activeIndex].href}"]`
        ) as HTMLAnchorElement;
        link?.click();
      }
    },
    enabled: activeIndex !== -1,
  });

  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      className={cn('mx-auto', className)}
    >
      <ul
        ref={navRef}
        className="flex flex-wrap items-center justify-center gap-6"
        role="menubar"
      >
        {items.map((item, index) => {
          const isActive = pathname === item.href;
          return (
            <li key={item.href} role="none">
              <Link
                href={item.href}
                className={cn(
                  'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  isActive
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'hover:bg-accent hover:text-accent-foreground'
                )}
                role="menuitem"
                aria-current={isActive ? 'page' : undefined}
                tabIndex={activeIndex === index ? 0 : -1}
                onFocus={() => setActiveIndex(index)}
                onBlur={() => setActiveIndex(-1)}
                aria-describedby={item.description ? `desc-${index}` : undefined}
              >
                {item.label}
              </Link>
              {item.description && (
                <div
                  id={`desc-${index}`}
                  className="sr-only"
                >
                  {item.description}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}