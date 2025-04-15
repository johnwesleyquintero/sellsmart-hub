var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import fs from 'fs';
import matter from 'gray-matter';
import path from 'path';
// Add utility function for consistent date handling
function normalizeDate(date) {
    const d = new Date(date);
    return d.toISOString().split('T')[0]; // YYYY-MM-DD format
}
const postsDirectory = path.join(process.cwd(), 'content/blog');
export function getAllPosts() {
    return __awaiter(this, void 0, void 0, function* () {
        // Check if directory exists
        if (!fs.existsSync(postsDirectory)) {
            const { posts } = yield import('@/data/portfolio-data/blog.json');
            if (!posts)
                return [];
            return posts
                .map((post) => {
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
            })
                .sort((a, b) => normalizeDate(b.date).localeCompare(normalizeDate(a.date)));
        }
        const fileNames = fs.readdirSync(postsDirectory);
        const allPostsData = yield Promise.all(fileNames
            .filter((fileName) => fileName.endsWith('.mdx'))
            .map((fileName) => __awaiter(this, void 0, void 0, function* () {
            const slug = fileName.replace(/\.mdx$/, '');
            const fullPath = path.join(postsDirectory, fileName);
            const fileContents = fs.readFileSync(fullPath, 'utf8');
            const { data } = matter(fileContents);
            return {
                slug,
                title: data.title,
                description: data.description,
                date: normalizeDate(data.date), // Normalize dates to YYYY-MM-DD format
                image: data.image || `/public/images/blog/${slug}.svg`,
                tags: data.tags || [],
                readingTime: data.readingTime || '5 min read',
                author: data.author || 'Wesley Quintero',
            };
        })));
        return allPostsData.sort((a, b) => normalizeDate(b.date).localeCompare(normalizeDate(a.date)));
    });
}
export function getPostBySlug(slug) {
    return __awaiter(this, void 0, void 0, function* () {
        // Check if directory exists
        if (!fs.existsSync(postsDirectory)) {
            // If not, return sample data from data/portfolio-data/blog.json
            const blogData = yield import('@/data/portfolio-data/blog.json');
            const post = blogData.posts.find((post) => post.id === slug);
            if (!post)
                return null;
            // Get related posts
            if (!blogData.posts)
                return null;
            const allPosts = blogData.posts;
            const relatedPosts = allPosts
                .filter((p) => { var _a; return p.id !== slug && ((_a = p.tags) === null || _a === void 0 ? void 0 : _a.some((tag) => { var _a; return (_a = post.tags) === null || _a === void 0 ? void 0 : _a.includes(tag); })); })
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
            return Object.assign(Object.assign({}, post), { relatedPosts });
        }
        try {
            const fullPath = path.join(postsDirectory, `${slug}.mdx`);
            const fileContents = fs.readFileSync(fullPath, 'utf8');
            const { data, content } = matter(fileContents);
            // Get related posts
            const allPosts = yield getAllPosts();
            const relatedPosts = allPosts
                .filter((post) => post.slug !== slug &&
                post.tags.some((tag) => data.tags.includes(tag)))
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
        }
        catch (_a) {
            return null;
        }
    });
}
