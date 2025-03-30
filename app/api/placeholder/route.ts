import { type NextRequest, NextResponse } from 'next/server';
import { generatePlaceholderDiagram } from '@/lib/generate-placeholder';
import mermaid from 'mermaid';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const type = (searchParams.get('type') as string) || 'flow';
    const title = searchParams.get('title') || '';
        const theme = (searchParams.get('theme') || 'default');

    // Configure mermaid
    mermaid.initialize({
      theme: theme as 'default' | 'base' | 'dark' | 'forest' | 'neutral' | 'null',
      startOnLoad: false,
      securityLevel: 'strict',
      flowchart: { curve: 'basis' },
    });

    // Generate diagram
        //const diagram = generatePlaceholderDiagram(type, title);
    const svg = "";
    //const { svg } = await mermaid.render('diagram');

    //return new NextResponse(svg, {
    //  headers: {
    //    'Content-Type': 'image/svg+xml',
    //    'Cache-Control': 'public, max-age=31536000, immutable',
    //  },
    //});
  } catch (error) {
    console.error('Error generating placeholder:', error);
    return NextResponse.json(
      { error: 'Error generating placeholder' },
      { status: 500 },
    );
  }
}
