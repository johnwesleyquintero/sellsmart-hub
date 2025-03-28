import { Metadata } from "next";
import { notFound } from "next/navigation";

import { AuthorBio } from "@/components/blog/author-bio";
import { BookmarkButton } from "@/components/blog/bookmark-button";
import { Comments } from "@/components/blog/comments";
import { NewsletterForm } from "@/components/blog/newsletter-form";
import { ReadingProgress } from "@/components/blog/reading-progress";
import { ShareButton } from "@/components/blog/share-button";
import { TableOfContents } from "@/components/blog/table-of-contents";
import { components } from "@/components/mdx";
import { MDXRemote } from "next-mdx-remote/rsc";

interface Post {
  id: string;
  title: string;
  description: string;
  date: string;
  author: string;
  tags: string[];
  image: string;
  readingTime: string;
  category: string;
  tools?: { id: string }[];
  content: string;
}

interface Props {
  params: {
    slug?: string;
  };
}

async function getBlogPost(slug: string): Promise<Post | null> {
  try {
    const { posts } = await import("@/data/blog.json").then((m) => m.default);
    if (!Array.isArray(posts)) {
      console.error("Posts data is not an array");
      return null;
    }
    const post = posts.find((post: Post) => post.id === slug);
    if (!post) return null;

    // Ensure all required fields exist
    return {
      id: post.id || "",
      title: post.title || "",
      description: post.description || "",
      date: post.date || "",
      author: post.author || "",
      tags: Array.isArray(post.tags) ? post.tags : [],
      image: post.image || "",
      readingTime: post.readingTime || "",
      category: post.category || "",
      content: post.content || "",
      tools: post.tools || [],
    };
  } catch (error) {
    console.error(`Error loading blog post ${slug}:`, error);
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = params;
  const post = await getBlogPost(slug!);

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
  try {
    const { posts } = await import("@/data/blog.json").then((m) => m.default);
    if (!Array.isArray(posts)) return [];
    return posts.filter((post) => post?.id).map((post) => ({ slug: post.id }));
  } catch (error) {
    console.error("Error generating static params:", error);
    return [];
  }
}

export default async function BlogPost({
  params,
}: {
  params: { slug: string };
}) {
  const post = await getBlogPost(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <article className="container relative mx-auto max-w-6xl px-4 py-12">
      <ReadingProgress />

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_250px]">
        <div>
          <div className="prose prose-slate max-w-none dark:prose-invert">
            <MDXRemote source={post.content} components={components} />
          </div>

          <AuthorBio author={post.author} className="mt-12" />

          <div className="mt-12">
            <NewsletterForm />
          </div>

          <div className="mt-12">
            <Comments postId={post.id} />
          </div>
        </div>

        <aside className="space-y-8">
          <div className="flex items-center gap-4">
            <BookmarkButton postId={post.id} />
            <ShareButton title={post.title} description={post.description} />
          </div>

          <TableOfContents />
        </aside>
      </div>
    </article>
  );
}
