import { CardFooter } from "@/components/ui/card"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight, Calendar } from "lucide-react"

import { getPosts } from "@/lib/blog"

const blogPosts = await getPosts()

export default function BlogSection() {
  return (
    <section id="blog" className="bg-muted/30 py-20">
      <div className="container">
        <div className="mb-12 text-center">
          <h2 className="section-heading">Blog & Articles</h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Sharing insights and strategies for Amazon sellers and e-commerce businesses.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {blogPosts.slice(0, 6).map((post) => (
            <Card key={post.id} className="overflow-hidden transition-all duration-300 hover:shadow-lg">
              <div className="aspect-video overflow-hidden">
                <Image
                  src={post.image || "/default-image.svg"}
                  alt={post.title}
                  width={600}
                  height={400}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 600px"
                />
              </div>
              <CardHeader className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{post.date}</span>
                </div>
                <CardTitle className="line-clamp-2 text-lg">{post.title}</CardTitle>
                <CardDescription className="line-clamp-3">{post.summary}</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <Button asChild variant="ghost" className="p-0 hover:bg-transparent">
                  <Link
                    href={`/blog/${post.id}`}
                    className="flex items-center text-primary"
                  >
                    Read Article <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Button asChild variant="outline" size="lg">
            <Link href="/blog">
              View All Articles <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

