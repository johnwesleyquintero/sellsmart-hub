var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { mdxComponents } from '@/components/blog/mdx-components';
import { Badge } from '@/components/ui/badge';
import { getAllPosts, getPostBySlug } from '@/lib/mdx';
import { ArrowLeft, Calendar, Clock, Tag } from 'lucide-react';
import { MDXRemote } from 'next-mdx-remote/rsc';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
export function generateMetadata(_a) {
    return __awaiter(this, arguments, void 0, function* ({ params }) {
        try {
            const post = yield getPostBySlug(params.slug);
            if (!post) {
                return {
                    title: 'Post Not Found | Wesley Quintero',
                    description: 'The requested blog post could not be found.',
                    openGraph: {
                        title: 'Post Not Found | Wesley Quintero',
                        description: 'The requested blog post could not be found.',
                        images: [
                            {
                                url: '/default-fallback.svg',
                                width: 1200,
                                height: 630,
                                alt: 'Post Not Found',
                            },
                        ],
                    },
                    twitter: {
                        card: 'summary_large_image',
                        title: 'Post Not Found | Wesley Quintero',
                        description: 'The requested blog post could not be found.',
                        images: ['/default-fallback.svg'],
                    },
                };
            }
            const canonicalUrl = new URL(`/blog/${params.slug}`, 'https://wesleyquintero.vercel.app').toString();
            return {
                title: `${post.title} | Wesley Quintero`,
                description: post.description,
                alternates: {
                    canonical: canonicalUrl,
                },
                openGraph: {
                    title: post.title,
                    description: post.description,
                    type: 'article',
                    publishedTime: post.date,
                    authors: ['Wesley Quintero'],
                    tags: post.tags,
                    url: canonicalUrl,
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
        }
        catch (error) {
            console.error('Error generating metadata:', error);
            return {
                title: 'Error | Wesley Quintero',
                description: 'An error occurred while loading this blog post.',
            };
        }
    });
}
export function generateStaticParams() {
    return __awaiter(this, void 0, void 0, function* () {
        const posts = yield getAllPosts();
        return posts.map((post) => ({
            slug: post.slug,
        }));
    });
}
export default function BlogPost(_a) {
    return __awaiter(this, arguments, void 0, function* ({ params }) {
        var _b;
        const post = yield getPostBySlug(params.slug);
        if (!post) {
            notFound();
        }
        // Related posts functionality removed as it's currently unused
        return (<div className="bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 min-h-screen">
      <div className="container mx-auto px-4 py-16">
        <div className="mb-8">
          <Link href="/blog" className="flex items-center text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4"/>
            Back to all articles
          </Link>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map((tag) => (<Badge key={tag} variant="secondary" className="text-xs">
                  <Tag className="h-3 w-3 mr-1"/>
                  {tag}
                </Badge>))}
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
              {post.title}
            </h1>

            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4"/>
                <span>{post.date}</span>
              </div>
              {post.readingTime && (<div className="flex items-center gap-1">
                  <Clock className="h-4 w-4"/>
                  <span>{post.readingTime}</span>
                </div>)}
            </div>

            {post.image && (<div className="mb-8 overflow-hidden rounded-lg">
                <Image src={post.image || '/placeholder.svg'} alt={post.title} width={1200} height={630} className="w-full object-cover"/>
              </div>)}
          </div>

          <article className="prose prose-lg dark:prose-invert max-w-none">
            <MDXRemote source={post.content} components={mdxComponents}/>
          </article>

          <div className="mt-16 pt-8 border-t">
            <h2 className="text-2xl font-bold mb-4">Continue Reading</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {(_b = post.relatedPosts) === null || _b === void 0 ? void 0 : _b.map((relatedPost) => (<Link key={relatedPost.slug} href={`/blog/${relatedPost.slug}`} className="block p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                    <h3 className="font-medium mb-1">
                      {relatedPost.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {relatedPost.description || ''}
                    </p>
                  </Link>))}
            </div>
          </div>
        </div>
      </div>
    </div>);
    });
}
