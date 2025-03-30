import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const postsDirectory = path.join(process.cwd(), 'content/blog');

export async function getAllPosts() {
  // Check if directory exists
  if (!fs.existsSync(postsDirectory)) {
    // If not, return sample data from data/blog.json
    const blogData = await import('@/data/blog.json');
    return blogData.posts.map((post) => ({
      slug: post.id,
      title: post.title,
      description: post.description,
      date: post.date,
      image: post.image || `/images/blog/${post.id}.svg`,
      tags: post.tags || [],
      readingTime: post.readingTime || '5 min read',
      author: post.author || 'Wesley Quintero',
    }));
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
          date: data.date,
          image: data.image || `/images/blog/${slug}.svg`,
          tags: data.tags || [],
          readingTime: data.readingTime || '5 min read',
          author: data.author || 'Wesley Quintero',
        };
      }),
  );

  return allPostsData.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getPostBySlug(slug: string) {
  // Check if directory exists
  if (!fs.existsSync(postsDirectory)) {
    // If not, return sample data from data/blog.json
    const blogData = await import('@/data/blog.json');
    const post = blogData.posts.find((post) => post.id === slug);

    if (!post) return null;

    // Get related posts
    const allPosts = blogData.posts;
    const relatedPosts = allPosts
      .filter(
        (p) => p.id !== slug && p.tags.some((tag) => post.tags.includes(tag)),
      )
      .slice(0, 2)
      .map((p) => ({
        slug: p.id,
        title: p.title,
        description: p.description,
      }));

    return {
      slug: post.id,
      title: post.title,
      description: post.description,
      date: post.date,
      image: post.image || `/images/blog/${post.id}.svg`,
      tags: post.tags || [],
      readingTime: post.readingTime || '5 min read',
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
        (post) =>
          post.slug !== slug &&
          post.tags.some((tag) => data.tags.includes(tag)),
      )
      .slice(0, 2);

    return {
      slug,
      title: data.title,
      description: data.description,
      date: data.date,
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
