import { notFound } from "next/navigation";
import Image from "next/image";
import { Metadata } from "next";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import MDXContent from "./mdx-content";

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

interface Props {
  params: {
    slug: string;
  };
}

async function getBlogPost(slug: string): Promise<Post | null> {
  const posts = await import("@/data/blog.json").then((m) => m.default.posts);
  return posts.find((post: Post) => post.id === slug) || null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = params;
  const post = await getBlogPost(slug);

  if (!post) {
    return {
      title: "Blog Post Not Found",
    };
  }

  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      authors: [post.author],
      publishedTime: post.date,
    },
  };
}

export async function generateStaticParams() {
  const posts = await import("@/data/blog.json").then((m) => m.default.posts);
  return posts.map((post: Post) => ({
    slug: post.id,
  }));
}

export default async function BlogPost({ params }: Props) {
  const { slug } = params;
  const post = await getBlogPost(slug);

  if (!post) {
    notFound();
  }

  return (
    <article className="container mx-auto max-w-3xl px-4 py-16 md:py-24">
      <div className="mb-12">
        <Button
          asChild
          variant="ghost"
          className="mb-6 -ml-4 h-8 text-muted-foreground hover:text-foreground"
        >
          <Link href="/blog" className="flex items-center gap-2">
            <ChevronLeft className="h-4 w-4" />
            Back to Blog
          </Link>
        </Button>
        <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-5xl">
          {post.title}
        </h1>
        <div className="mb-6 flex items-center gap-4 text-muted-foreground">
          <span>{post.date}</span>
          <span>•</span>
          <span>{post.readingTime}</span>
          <span>•</span>
          <span>{post.author}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      </div>
      {post.image && (
        <div className="relative mb-12 aspect-video w-full overflow-hidden rounded-xl shadow-lg">
          <Image
            src={post.image}
            alt={post.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}
      <div className="prose prose-lg dark:prose-invert">
        <MDXContent slug={params.slug} />
      </div>
    </article>
  );
}
