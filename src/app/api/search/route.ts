import { apiKeyMiddleware } from '@/api-key-management';
import { loadStaticData } from '@/load-static-data';
import { BlogPost } from '@/static-data-types';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const authResponse = apiKeyMiddleware(request);
  if (authResponse) return authResponse;
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
    const blogPosts = await loadStaticData('blog');

    // Load tools data
    const tools = await loadStaticData('tools');

    const blogResults = blogPosts.filter(
      (post: BlogPost) =>
        post.title.toLowerCase().includes(query) ||
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
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 },
    );
  }
}
