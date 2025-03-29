import { NextResponse } from 'next/server';
import { loadStaticData } from '@/lib/load-static-data';
import { BlogPost } from '@/lib/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.toLowerCase() || '';

  if (!query) {
    return NextResponse.json(
      { error: 'Search query is required' },
      { status: 400 },
    );
  }

  try {
    // Load blog posts
    const blogPosts = await loadStaticData<BlogPost[]>('blog');

    // Load tools data
    const tools =
      await loadStaticData<{ name: string; description: string }[]>('tools');

    // Search blog posts
    const blogResults = blogPosts.filter(
      (post) =>
        post.title.toLowerCase().includes(query) ||
        post.description.toLowerCase().includes(query) ||
        post.content.toLowerCase().includes(query),
    );

    // Search tools
    const toolResults = tools.filter(
      (tool) =>
        tool.name.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query),
    );

    return NextResponse.json({
      blog: blogResults,
      tools: toolResults,
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 },
    );
  }
}
