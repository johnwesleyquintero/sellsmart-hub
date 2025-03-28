"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Post {
  id: string;
  title: string;
  description: string;
  date: string;
  author: string;
  tags: string[];
  image: string;
  readingTime: string;
}

interface RelatedArticlesProps {
  currentPostId: string;
  currentTags: string[];
  allPosts: Post[];
}

export function RelatedArticles({
  currentPostId,
  currentTags,
  allPosts,
}: RelatedArticlesProps) {
  const relatedPosts = allPosts
    .filter((post) => post.id !== currentPostId)
    .filter((post) => post.tags.some((tag) => currentTags.includes(tag)))
    .slice(0, 3);

  if (relatedPosts.length === 0) return null;

  return (
    <div className="mt-16 border-t pt-8 bg-muted/30 rounded-xl p-8">
      <h2 className="mb-8 text-2xl font-bold flex items-center gap-2">
        <span>Related Articles</span>
        <Badge variant="outline" className="text-xs">
          {relatedPosts.length}
        </Badge>
      </h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {relatedPosts.map((post) => (
          <Card
            key={post.id}
            className="overflow-hidden group hover:shadow-lg transition-all duration-300"
          >
            <Link href={`/blog/${post.id}`}>
              <div className="relative aspect-video overflow-hidden">
                <Image
                  src={post.image || "/default.svg"}
                  alt={post.title}
                  fill
                  className="object-cover transition-transform hover:scale-105"
                />
              </div>
            </Link>
            <CardHeader className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
              <Link
                href={`/blog/${post.id}`}
                className="line-clamp-2 text-lg font-semibold hover:text-primary"
              >
                {post.title}
              </Link>
              <p className="line-clamp-2 text-sm text-muted-foreground">
                {post.description}
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{post.date}</span>
                <span>{post.readingTime}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
