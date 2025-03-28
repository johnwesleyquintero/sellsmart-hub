"use client";

import { useEffect, useState } from "react";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export function TableOfContents() {
  const [headings, setHeadings] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const headingElements = Array.from(document.querySelectorAll("h2, h3"));

    const items = headingElements.map((heading) => ({
      id: heading.id,
      text: heading.textContent || "",
      level: Number(heading.tagName.charAt(1)),
    }));

    setHeadings(items);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "0% 0% -80% 0%" },
    );

    headingElements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return (
    <nav className="sticky top-24 max-h-[calc(100vh-6rem)] overflow-auto">
      <h4 className="mb-4 text-sm font-medium">Table of Contents</h4>
      <ul className="space-y-2 text-sm">
        {headings.map((heading) => (
          <li
            key={heading.id}
            style={{ paddingLeft: `${(heading.level - 2) * 1}rem` }}
          >
            <a
              href={`#${heading.id}`}
              className={`block transition-colors hover:text-primary ${
                activeId === heading.id
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
