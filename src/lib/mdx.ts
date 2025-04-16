import fs from 'fs';
import matter from 'gray-matter';
import path from 'path';
import { BlogPost } from './types';

// Add utility function for consistent date handling
function normalizeDate(date: string | Date) {
  const d = new Date(date);
  return d.toISOString().split('T')[0]; // YYYY-MM-DD format
}

const postsDirectory = path.join(process.cwd(), 'src/app/content/blog');

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
          content?: string;
        }): BlogPost => {
          return {
            id: post.id,
            slug: post.id,
            title: post.title,
            description: post.description,
            date: normalizeDate(post.date),
            image: post.image || `/public/images/blog/${post.id}.svg`,
            tags: post.tags || [],
            readingTime: post.readingTime || '5 min read',
            author: post.author || 'Wesley Quintero',
            content: '',
          };
        },
      )
      .sort((a, b) =>
        normalizeDate(b.date).localeCompare(normalizeDate(a.date)),
      );
  }
  console.time('readdirSync');
  const fileNames = fs.readdirSync(postsDirectory);
  console.timeEnd('readdirSync');
  const allPostsData = await Promise.all(
    fileNames
      .filter((fileName) => fileName.endsWith('.mdx'))
      .map(async (fileName) => {
        const slug = fileName.replace(/\.mdx$/, '');
        const fullPath = path.join(postsDirectory, fileName);
        const fileContents = fs.readFileSync(fullPath, 'utf8');
        const { data } = matter(fileContents);

        return {
          id: slug,
          slug,
          title: data.title,
          description: data.description,
          date: normalizeDate(data.date), // Normalize dates to YYYY-MM-DD format
          image: data.image
            ? `/public/${data.image}`
            : `/public/images/blog/${slug}.svg`,
          tags: data.tags || [],
          readingTime: data.readingTime || '5 min read',
          author: data.author || 'Wesley Quintero',
          content: '',
        };
      }),
  );

  return allPostsData.sort((a: BlogPost, b: BlogPost) =>
    normalizeDate(b.date).localeCompare(normalizeDate(a.date)),
  );
}

interface BlogPostData {
  id: string;
  title: string;
  tags?: string[];
}

export async function getPostBySlug(slug: string) {
  // Check if directory exists
  if (!fs.existsSync(postsDirectory)) {
    // If not, return sample data from data/portfolio-data/blog.json
    const blogData = await import('@/data/portfolio-data/blog.json');
    const post = blogData.posts.find((post: BlogPostData) => post.id === slug);

    if (!post) return null;

    // Get related posts
    if (!blogData.posts) return null;
    const allPosts = blogData.posts;
    const relatedPosts = allPosts
      .filter(
        (p) => p.id !== slug && p.tags.some((tag) => post.tags.includes(tag)),
      )
      .slice(0, 2)
      .map((p) => ({
        id: p.id,
        slug: p.id,
        title: p.title,
        description: p.description,
        date: normalizeDate(p.date),
        image: p.image || `/public/images/blog/${p.id}.svg`,
        tags: p.tags || [],
        readingTime: p.readingTime || '5 min read',
        author: p.author || 'Wesley Quintero',
        content: '',
      }));

    return {
      ...post,
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
      image: data.image || `/public/images/blog/${slug}.svg`,
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
