import { Button } from '@/components/ui/button';
import { getAllPosts } from '@/lib/mdx';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { BlogPostCard } from './blog/blog-card';

export default async function BlogSection() {
  const posts = await getAllPosts();
  const recentPosts = posts.slice(0, 6);

  return (
    <section id="blog" className="bg-muted/30 py-20">
      <div className="container">
        <div className="mb-12 text-center">
          <h2 className="section-heading">Blog &amp; Articles</h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Sharing insights and strategies for Amazon sellers and e-commerce
            businesses.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {recentPosts.map((post) => (
            <BlogPostCard
              key={post.id}
              post={{ ...post, relatedPosts: post.relatedPosts || [] }}
            />
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
  );
}
