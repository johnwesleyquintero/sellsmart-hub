import { MDXRemote } from 'next-mdx-remote/rsc'
import { readFileSync } from 'fs'
import { join } from 'path'

interface Props {
  slug: string
}

export default async function MDXContent({ slug }: Props) {
  const filePath = join(process.cwd(), 'app', 'blog', slug, 'content.mdx')
  const source = readFileSync(filePath, 'utf8')

  return (
    <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:mb-4 prose-h1:text-4xl prose-h2:text-3xl prose-h3:text-2xl prose-p:mb-6 prose-p:leading-7 prose-li:my-2 prose-ul:space-y-2 prose-ol:space-y-2 prose-pre:my-6 prose-blockquote:my-6 prose-img:my-8">
      <MDXRemote source={source} />
    </div>
  )
}