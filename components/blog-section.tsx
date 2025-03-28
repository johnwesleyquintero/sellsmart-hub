"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";
import { Calendar, Clock, Search, Tag } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const categories = [
  "All",
  "Amazon SEO",
  "PPC Strategy",
  "Product Research",
  "Listing Optimization",
  "Inventory Management",
];

interface BlogPost {
  id: string;
  title: string;
  description: string;
  category: string;
  date: string;
  readingTime: string;
  image: string;
  tags: string[];
  tools?: string[];
}

export default function BlogSection() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    // Load blog posts from the JSON file
    const loadPosts = async () => {
      const { posts } = await import("@/data/blog.json");
      setBlogPosts(posts);
    };
    loadPosts();
  }, []);

  const filteredPosts = blogPosts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (Array.isArray(post.tags) &&
        post.tags.some(
          (tag) =>
            typeof tag === "string" &&
            tag.toLowerCase().includes(searchTerm.toLowerCase()),
        ));

    const matchesCategory =
      selectedCategory === "All" || post.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <section id="blog" className="container mx-auto px-4 py-32">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            Amazon Seller Resources
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            In-depth guides, case studies, and strategies to help you succeed on
            Amazon
          </p>
        </div>

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1 md:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search articles..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPosts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={`/blog/${post.id}`}>
                <Card className="group h-full transition-shadow hover:shadow-lg">
                  <CardHeader className="relative overflow-hidden p-0">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="aspect-video w-full object-cover transition-transform group-hover:scale-105"
                    />
                    <Badge className="absolute right-2 top-2">
                      {post.category}
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-4">
                    <CardTitle className="line-clamp-2 mb-2 text-xl">
                      {post.title}
                    </CardTitle>
                    <p className="line-clamp-3 text-sm text-muted-foreground">
                      {post.description}
                    </p>
                  </CardContent>
                  <CardFooter className="p-4">
                    <div className="flex w-full flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {post.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {post.readingTime}
                      </span>
                      {post.tools && (
                        <div className="flex items-center gap-1">
                          <Tag className="h-4 w-4" />
                          <span className="text-primary">
                            Related Tools ({post.tools.length})
                          </span>
                        </div>
                      )}
                    </div>
                  </CardFooter>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
