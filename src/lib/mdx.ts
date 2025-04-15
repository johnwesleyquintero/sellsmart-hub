import fs from 'fs';
import matter from 'gray-matter';
import path from 'path';
import { BlogPost } from './types';

// Add utility function for consistent date handling
function normalizeDate(date: string | Date) {
  const d = new Date(date);
  return d.toISOString().split('T')[0]; // YYYY-MM-DD format
}

const postsDirectory = path.join(process.cwd(), 'content/blog');

export async function getAllPosts(): Promise<BlogPost[]> {
  // Check if directory exists
  if (!fs.existsSync(postsDirectory)) {
    const { posts } = await import('@/data/portfolio-data/blog.json');
    if (!posts) return [];

    return posts
      .map(
        (post: {
          id: string;
          title: string;
          description: string;
          date: string;
          image?: string;
          tags?: string[];
          readingTime?: string;
          author?: string;
        }): BlogPost => ({
          slug: post.id,
          title: post.title,
          description: post.description,
          date: normalizeDate(post.date),
          image: post.image || `/images/blog/${post.id}.svg`,
          tags: post.tags || [],
          readingTime: post.readingTime || '5 min read',
          author: post.author || 'Wesley Quintero',
        }),
      )
      .sort((a, b) =>
        normalizeDate(b.date).localeCompare(normalizeDate(a.date)),
      );
  }
  const fileNames = fs.readdirSync(postsDirectory);
  const allPostsData = await Promise.all(
    fileNames
      .filter((fileName) => fileName.endsWith('.mdx'))
      .map(async (fileName) => {
        const slug = fileName.replace(/\.mdx$/, '');
        const fullPath = path.join(postsDirectory, fileName);
        const fileContents = fs.readFileSync(fullPath, 'utf8');
        const { data } = matter(fileContents);

        return {
          slug,
          title: data.title,
          description: data.description,
          date: normalizeDate(data.date), // Normalize dates to YYYY-MM-DD format
          image: data.image || `/images/blog/${slug}.svg`,
          tags: data.tags || [],
          readingTime: data.readingTime || '5 min read',
          author: data.author || 'Wesley Quintero',
        };
      }),
  );

  return allPostsData.sort((a: BlogPost, b: BlogPost) =>
    normalizeDate(b.date).localeCompare(normalizeDate(a.date)),
  );
}

export async function getPostBySlug(slug: string) {
  // Check if directory exists
  if (!fs.existsSync(postsDirectory)) {
    // If not, return sample data from data/portfolio-data/blog.json
    const blogData = await import('@/data/portfolio-data/blog.json');
    const post = blogData.posts.find((post: any) => post.id === slug);

    if (!post) return null;

    // Get related posts
    if (!blogData.posts) return null;
    const allPosts = blogData.posts;
    const relatedPosts =
      allPosts
        .filter(
          (p) =>
            p.id !== slug && p.tags.some((tag) => post.tags?.includes(tag)),
        )
        .slice(0, 2)
        .map((p) => ({
          slug: p.id,
          title: p.title,
          description: p.description,
        })) || [];

    return {
      slug: post.id,
      title: post.title,
      description: post.description,
      date: normalizeDate(post.date), // Normalize dates to YYYY-MM-DD format
      image: post.image || `/images/blog/${post.id}.svg`,
      tags: post.tags || [],
      readingTime: data.readingTime || '5 min read',
      author: post.author || 'Wesley Quintero',
      content: post.content || '',
      relatedPosts,
    };
  }

  try {
    const fullPath = path.join(postsDirectory, `${slug}.mdx`);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    // Get related posts
    const allPosts = await getAllPosts();
    const relatedPosts = allPosts
      .filter(
        (post: BlogPost) =>
          post.slug !== slug &&
          post.tags.some((tag: string) => data.tags.includes(tag)),
      )
      .slice(0, 2);

    return {
      slug,
      title: data.title,
      description: data.description,
      date: normalizeDate(data.date), // Normalize dates to YYYY-MM-DD format
      image: data.image || `/images/blog/${slug}.svg`,
      tags: data.tags || [],
      readingTime: data.readingTime || '5 min read',
      author: data.author || 'Wesley Quintero',
      content,
      relatedPosts,
    };
  } catch {
    return null;
  }
}
