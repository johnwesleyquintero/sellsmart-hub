import Image from "next/image"
import Link from "next/link"
import { Metadata } from "next"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Blog - Wesley Quintero Dev",
  description: "Insights and guides about Amazon FBA, e-commerce, and entrepreneurship",
}

interface Post {
  id: string
  title: string
  description: string
  date: string
  author: string
  tags: string[]
  image: string
  readingTime: string
}

async function getBlogPosts(): Promise<Post[]> {
  const { posts } = await import("@/data/blog.json").then((m) => m.default)
  return posts
}

export default async function BlogPage() {
  const posts = await getBlogPosts()

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold">Blog</h1>
        <p className="text-xl text-muted-foreground">
          Insights and guides about Amazon FBA, e-commerce, and entrepreneurship
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <Card key={post.id} className="overflow-hidden">
            <Link href={`/blog/${post.id}`}>
              <div className="relative aspect-video overflow-hidden">
                <Image
                  src={post.image || "/default-image.svg"}
                  alt={post.title}
                  fill
                  className="object-cover transition-transform hover:scale-105"
                />
              </div>
              <CardHeader>
                <h2 className="line-clamp-2 text-xl font-semibold">{post.title}</h2>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-3 text-muted-foreground">{post.description}</p>
              </CardContent>
              <CardFooter className="flex flex-wrap items-center gap-4">
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <span className="ml-auto text-sm text-muted-foreground">{post.readingTime}</span>
              </CardFooter>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  )
}