var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { apiKeyMiddleware } from '@/lib/api-key-management';
import { loadStaticData } from '@/lib/load-static-data';
import { NextResponse } from 'next/server';
export function GET(request) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const authResponse = apiKeyMiddleware(request);
        if (authResponse)
            return authResponse;
        const { searchParams } = new URL(request.url);
        const query = ((_a = searchParams.get('q')) === null || _a === void 0 ? void 0 : _a.toLowerCase()) || '';
        if (!query) {
            return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
        }
        try {
            // Load blog posts
            const blogPosts = yield loadStaticData('blog');
            // Load tools data
            const tools = yield loadStaticData('tools');
            const blogResults = blogPosts.filter((post) => post.title.toLowerCase().includes(query) ||
                post.content.toLowerCase().includes(query));
            // Search tools
            const toolResults = tools.filter((tool) => tool.name.toLowerCase().includes(query) ||
                tool.description.toLowerCase().includes(query));
            return NextResponse.json({
                blog: blogResults,
                tools: toolResults,
            });
        }
        catch (error) {
            console.error('Search error:', error);
            return NextResponse.json({ error: 'Failed to perform search' }, { status: 500 });
        }
    });
}
