'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { BlogPost } from '@/lib/static-data-types';
import { ArrowRight, Calendar } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
interface BlogPostCardProps {
  post: BlogPost;
}

export function BlogPostCard({ post }: Readonly<BlogPostCardProps>) {
  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg group hover:border-primary">
      <div className="aspect-video overflow-hidden relative">
        <Image
          src={post.image || '/default-fallback.svg'}
          alt={post.title}
          width={800}
          height={400}
          quality={75}
          loading="lazy"
          className="object-cover transition-transform duration-300 group-hover:scale-105 opacity-100"
          data-testid="blog-image"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          data-testid="image-overlay"
        ></div>
      </div>
      <CardHeader className="p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            {new Date(post.date).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{post.readingTime}</span>
        </div>
        <CardTitle className="line-clamp-2 text-lg">{post.title}</CardTitle>
        <CardDescription className="line-clamp-3">
          {post.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="text-xs"
              data-testid="blog-tag"
            >
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button
          asChild
          variant="ghost"
          className="p-0 hover:bg-transparent group"
        >
          <Link
            href={`/blog/${post.slug}`}
            className="flex items-center text-primary group-hover:underline"
          >
            Read Article{' '}
            <ArrowRight
              className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300"
              data-testid="arrow-icon"
            />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
