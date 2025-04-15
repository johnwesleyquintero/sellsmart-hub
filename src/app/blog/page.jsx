var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import Link from 'next/link';
import Image from 'next/image';
import { getAllPosts } from '@/lib/mdx';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
export const metadata = {
    title: 'Blog | Wesley Quintero',
    description: 'Insights and strategies for Amazon sellers and e-commerce businesses.',
};
export default function BlogPage() {
    return __awaiter(this, void 0, void 0, function* () {
        const posts = yield getAllPosts();
        return (<div className="bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 min-h-screen">
      <div className="container mx-auto px-4 py-16">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-4 md:text-5xl">
            Blog & Articles
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground text-lg">
            Sharing insights and strategies for Amazon sellers and e-commerce
            businesses.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (<Card key={post.slug} className="overflow-hidden transition-all duration-300 hover:shadow-lg">
              <div className="aspect-video overflow-hidden">
                <Image src={post.image || '/placeholder.svg?height=400&width=600'} alt={post.title} width={600} height={400} className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"/>
              </div>
              <CardHeader className="p-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4"/>
                    <span>{post.date}</span>
                  </div>
                  {post.readingTime && (<div className="flex items-center gap-1">
                      <Clock className="h-4 w-4"/>
                      <span>{post.readingTime}</span>
                    </div>)}
                </div>
                <CardTitle className="line-clamp-2 text-xl">
                  {post.title}
                </CardTitle>
                <CardDescription className="line-clamp-3">
                  {post.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (<Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>))}
                </div>
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <Link href={`/blog/${post.slug}`} className="flex items-center text-primary hover:underline">
                  Read Article <ArrowRight className="ml-2 h-4 w-4"/>
                </Link>
              </CardFooter>
            </Card>))}
        </div>
      </div>
    </div>);
    });
}
