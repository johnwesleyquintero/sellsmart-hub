import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, Clock, ArrowLeft, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getPostBySlug, getAllPosts } from '@/lib/mdx';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { mdxComponents } from '@/components/blog/mdx-components';

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  try {
    const post = await getPostBySlug(params.slug);

    if (!post) {
      return {
        title: 'Post Not Found | Wesley Quintero',
        description: 'The requested blog post could not be found.',
        openGraph: {
          title: 'Post Not Found | Wesley Quintero',
          description: 'The requested blog post could not be found.',
          images: [{ url: '/default-fallback.svg', width: 1200, height: 630, alt: 'Post Not Found' }]
        },
        twitter: {
          card: 'summary_large_image',
          title: 'Post Not Found | Wesley Quintero',
          description: 'The requested blog post could not be found.',
          images: ['/default-fallback.svg']
        }
      };
    }

    return {
      title: `${post.title} | Wesley Quintero`,
      description: post.description,
      alternates: {
        canonical: `https://wesleyquintero.vercel.app/blog/${params.slug}`,
      },
      openGraph: {
        title: post.title,
        description: post.description,
        type: 'article',
        publishedTime: post.date,
        authors: ['Wesley Quintero'],
        tags: post.tags,
        images: [
          {
            url: post.image || '/default-fallback.svg',
            width: 1200,
            height: 630,
            alt: post.title,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: post.title,
        description: post.description,
        images: [post.image || '/default-fallback.svg'],
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Error | Wesley Quintero',
      description: 'An error occurred while loading this blog post.',
    };
  }
}

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export default async function BlogPostPage({
  params,
}: {
  params: { slug: string };
}) {
  const post = await getPostBySlug(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 min-h-screen">
      <div className="container mx-auto px-4 py-16">
        <div className="mb-8">
          <Link
            href="/blog"
            className="flex items-center text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to all articles
          </Link>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>

            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
              {post.title}
            </h1>

            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{post.date}</span>
              </div>
              {post.readingTime && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{post.readingTime}</span>
                </div>
              )}
            </div>

            {post.image && (
              <div className="mb-8 overflow-hidden rounded-lg">
                <Image
                  src={post.image || '/placeholder.svg'}
                  alt={post.title}
                  width={1200}
                  height={630}
                  className="w-full object-cover"
                />
              </div>
            )}
          </div>

          <article className="prose prose-lg dark:prose-invert max-w-none">
            <MDXRemote source={post.content} components={mdxComponents} />
          </article>

          <div className="mt-16 pt-8 border-t">
            <h2 className="text-2xl font-bold mb-4">Continue Reading</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {post.relatedPosts?.map((relatedPost) => (
                <Link
                  key={relatedPost.slug}
                  href={`/blog/${relatedPost.slug}`}
                  className="block p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <h3 className="font-medium mb-1">{relatedPost.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {relatedPost.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
