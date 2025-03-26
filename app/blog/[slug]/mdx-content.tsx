import { MDXRemote } from 'next-mdx-remote/rsc'
import { readFileSync } from 'fs'
import { join } from 'path'
import { TableOfContents } from '@/components/blog/table-of-contents'
import { ReadingProgress } from '@/components/blog/reading-progress'
import { RelatedArticles } from '@/components/blog/related-articles'

interface Props {
  slug: string
}

export default async function MDXContent({ slug }: Props) {
  const filePath = join(process.cwd(), 'app', 'blog', slug, 'content.mdx')
  const source = readFileSync(filePath, 'utf8')
  const posts = await import('@/data/blog.json').then((m) => m.default.posts)
  const currentPost = posts.find((post: any) => post.id === slug)

  return (
    <>
      <ReadingProgress />
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_250px]">
          <div>
            <article className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-semibold prose-headings:tracking-tight prose-headings:mb-6 prose-h1:text-4xl prose-h2:text-3xl prose-h3:text-2xl prose-p:mb-6 prose-p:leading-8 prose-p:text-balance prose-li:my-3 prose-ul:space-y-3 prose-ol:space-y-3 prose-pre:my-8 prose-pre:bg-muted prose-pre:p-4 prose-pre:rounded-lg prose-blockquote:my-8 prose-blockquote:border-l-4 prose-blockquote:border-primary/40 prose-blockquote:pl-6 prose-blockquote:italic prose-img:my-12 prose-img:rounded-lg prose-a:text-primary hover:prose-a:text-primary/80 prose-a:no-underline hover:prose-a:underline">
              <MDXRemote source={source} />
            </article>
            {currentPost && (
              <RelatedArticles
                currentPostId={currentPost.id}
                currentTags={currentPost.tags}
                allPosts={posts}
              />
            )}
          </div>
          <div className="hidden lg:block">
            <TableOfContents />
          </div>
        </div>
      </div>
    </>
  )
}