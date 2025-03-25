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
    <div className="prose prose-lg dark:prose-invert">
      <MDXRemote source={source} />
    </div>
  )
}