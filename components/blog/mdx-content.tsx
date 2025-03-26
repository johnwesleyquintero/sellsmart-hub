'use client'

import { cn } from '@/lib/utils'
import { TableOfContents } from './table-of-contents'
import { ReadingProgress } from './reading-progress'
import { RelatedArticles } from './related-articles'

interface MDXContentProps {
  content: React.ReactNode
  currentPostId: string
  currentTags: string[]
  allPosts: any[]
}

export function MDXContent({ content, currentPostId, currentTags, allPosts }: MDXContentProps) {
  return (
    <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
      <ReadingProgress />
      <div className="grid grid-cols-1 gap-16 lg:grid-cols-[1fr_250px]">
        <article className="prose prose-slate max-w-none dark:prose-invert prose-headings:scroll-mt-24 prose-headings:font-display prose-headings:font-semibold prose-a:text-primary hover:prose-a:text-primary/80 prose-img:rounded-xl prose-img:shadow-md prose-pre:rounded-xl prose-pre:border prose-pre:border-primary/10 prose-pre:bg-muted/50 prose-pre:shadow-sm">
          {content}
        </article>
        <div className="hidden lg:block">
          <TableOfContents />
        </div>
      </div>
      <RelatedArticles
        currentPostId={currentPostId}
        currentTags={currentTags}
        allPosts={allPosts}
      />
    </div>
  )
}