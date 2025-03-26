'use client'

import { useEffect, useState } from 'react'
import { Link2 } from 'lucide-react'

interface TOCItem {
  id: string
  text: string
  level: number
}

export function TableOfContents() {
  const [toc, setToc] = useState<TOCItem[]>([])
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    const headings = document.querySelectorAll('h2, h3, h4')
    const tocItems: TOCItem[] = Array.from(headings).map((heading) => ({
      id: heading.id,
      text: heading.textContent || '',
      level: parseInt(heading.tagName[1])
    }))
    setToc(tocItems)

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        })
      },
      { rootMargin: '-100px 0px -66%' }
    )

    headings.forEach((heading) => observer.observe(heading))
    return () => observer.disconnect()
  }, [])

  if (toc.length === 0) return null

  return (
    <nav className="sticky top-24 max-h-[calc(100vh-6rem)] overflow-auto py-6 pr-4">
      <div className="mb-4 flex items-center space-x-2 text-sm font-medium">
        <Link2 className="h-4 w-4" />
        <span>Table of Contents</span>
      </div>
      <ul className="space-y-2.5 text-sm">
        {toc.map((item) => (
          <li
            key={item.id}
            className={`${item.level === 2 ? '' : 'pl-4'} ${activeId === item.id ? 'text-primary' : 'text-muted-foreground'}`}
          >
            <a
              href={`#${item.id}`}
              className="hover:text-primary"
              onClick={(e) => {
                e.preventDefault()
                document.getElementById(item.id)?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'start'
                })
              }}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}