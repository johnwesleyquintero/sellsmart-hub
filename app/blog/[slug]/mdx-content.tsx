"use client"

import { MDXRemote } from "next-mdx-remote/rsc"
import { serialize } from "next-mdx-remote/serialize"

interface Props {
  slug: string
}

export default async function MDXContent({ slug }: Props) {
  const content = await import(`../../${slug}/content.mdx`).then((m) => m.default)
  const mdxSource = await serialize(content)

  return (
    <div className="prose prose-lg dark:prose-invert">
      <MDXRemote {...mdxSource} />
    </div>
  )
}