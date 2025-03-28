"use client";

import { useEffect, useState } from "react";
import { Link2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TOCItem {
  id: string;
  text: string;
  level: number;
}

export function TableOfContents() {
  const [toc, setToc] = useState<TOCItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const headings = document.querySelectorAll("h2, h3, h4");
    const tocItems: TOCItem[] = Array.from(headings).map((heading) => ({
      id: heading.id,
      text: heading.textContent || "",
      level: parseInt(heading.tagName[1]),
    }));
    setToc(tocItems);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-100px 0px -66%", threshold: [0, 1] },
    );

    headings.forEach((heading) => observer.observe(heading));
    return () => observer.disconnect();
  }, []);

  if (toc.length === 0) return null;

  return (
    <nav className="sticky top-24 max-h-[calc(100vh-6rem)] overflow-auto py-6 pr-4 scrollbar-thin scrollbar-thumb-primary/20 hover:scrollbar-thumb-primary/40 scrollbar-track-transparent">
      <div className="mb-4 flex items-center space-x-2 text-sm font-medium border-b pb-2">
        <Link2 className="h-4 w-4" />
        <span>Table of Contents</span>
      </div>
      <ul className="space-y-2 text-sm">
        {toc.map((item) => (
          <li
            key={item.id}
            className={cn(
              "transition-all duration-200",
              item.level === 2 ? "mt-2" : "pl-4",
              item.level === 4 ? "pl-8" : "",
              activeId === item.id
                ? "text-primary font-medium"
                : "text-muted-foreground hover:text-primary",
            )}
          >
            <a
              href={`#${item.id}`}
              className="block py-1"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(item.id)?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                  inline: "nearest",
                });
              }}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
