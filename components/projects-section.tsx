"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExternalLink, Github } from "lucide-react";

const projects = [
  {
    id: 1,
    title: "SellSmart",
    description:
      "AI-powered analytics and automation tools delivered as a modern web application for Amazon sellers.",
    image: "/images/projects/sellsmart-hub.svg",
    tags: ["AI", "Analytics", "Automation", "Amazon"],
    liveUrl: "https://sellsmart-hub.vercel.app/",
    githubUrl: "https://github.com/johnwesleyquintero/sellsmart-hub",
    category: "data",
  },
  {
    id: 6,
    title: "SellSmart Design x Docs",
    description:
      "Comprehensive design system documentation with component guidelines, design tokens, and framework implementation details.",
    image: "/images/projects/sellsmart-docs.svg",
    tags: ["Documentation", "Design System", "Components"],
    liveUrl: "https://sellsmart-docs.vercel.app/",
    githubUrl: "https://github.com/johnwesleyquintero/sellsmart-docs",
    category: "data",
  },
  {
    id: 2,
    title: "DevFlowDB",
    description:
      "Lightweight WASM-powered SQL database with HTTPvfs integration. Handles 500+ queries/sec with <200ms latency (1MB demo). Features schema versioning and IndexedDB caching.",
    image: "/images/projects/devflowdb-preview.svg",
    tags: ["WASM", "SQL", "Performance", "Database"],
    liveUrl: "https://devflowdb.vercel.app/",
    githubUrl: "https://github.com/johnwesleyquintero/devflowdb",
    category: "data",
  },
  {
    id: 3,
    title: "Inventory Management",
    description:
      "Enhanced operational efficiency by 40% through streamlined listing management and account health monitoring.",
    image: "/images/projects/InventoryManagementSystem.svg",
    tags: ["Inventory", "Process Optimization", "SOP"],
    liveUrl: "https://sellsmart-docs.vercel.app/",
    githubUrl: "https://github.com/johnwesleyquintero/sellsmart-docs",
    category: "backend",
  },
  {
    id: 4,
    title: "FBA Department Operations",
    description:
      "Streamlined team productivity by 35% through comprehensive training materials and workflow planning.",
    image: "/images/projects/FBADepartmentOperations.svg",
    tags: ["Training", "Workflow", "Documentation"],
    liveUrl: "https://sellsmart-docs.vercel.app/",
    githubUrl: "https://github.com/johnwesleyquintero/sellsmart-docs",
    category: "backend",
  },
  {
    id: 5,
    title: "Wholesale Buyer's Guide",
    description:
      "Improved client satisfaction rate to 95% through optimized client engagement and inventory management.",
    image: "/images/projects/WholesaleBuyer'sGuide.svg",
    tags: ["Client Engagement", "Best Practices", "Documentation"],
    liveUrl: "https://sellsmart-docs.vercel.app/",
    githubUrl: "https://github.com/johnwesleyquintero/sellsmart-docs",
    category: "frontend",
  },
];

export default function ProjectsSection() {
  const [activeTab, setActiveTab] = useState("all");

  const filteredProjects =
    activeTab === "all"
      ? projects
      : projects.filter((project) => project.category === activeTab);

  return (
    <section id="projects" className="container relative mx-auto px-4 py-32">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-100/50 to-blue-100/50 dark:from-purple-950/50 dark:to-blue-950/50 blur-3xl"></div>
      </div>

      <div className="mx-auto max-w-5xl">
        <div className="mb-12">
          <Badge variant="secondary" className="mb-4">
            Projects
          </Badge>
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">Featured Work</h2>
          <p className="text-xl text-muted-foreground">
            A collection of my recent projects in Amazon marketplace
            optimization and e-commerce development.
          </p>
        </div>

        <Tabs defaultValue="all" className="mb-12" onValueChange={setActiveTab}>
          <div className="flex justify-center">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="data">Data</TabsTrigger>
              <TabsTrigger value="frontend">Frontend</TabsTrigger>
              <TabsTrigger value="backend">Backend</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={activeTab} className="mt-8">
            <div className="grid gap-6 sm:grid-cols-2">
              {filteredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}

function ProjectCard({ project }) {
  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg">
      <div className="aspect-video overflow-hidden bg-muted p-4">
        <Image
          src={project.image || "/images/projects/default.svg"}
          alt={`${project.title} image`}
          width={600}
          height={400}
          priority={project.id <= 2}
          loading={project.id <= 2 ? "eager" : "lazy"}
          decoding="async"
          className="h-full w-full object-contain"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
        />
      </div>
      <CardHeader>
        <CardTitle>{project.title}</CardTitle>
        <CardDescription>{project.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button asChild variant="outline" size="sm">
          <Link
            href={project.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Github className="mr-2 h-4 w-4" /> Code
          </Link>
        </Button>
        <Button asChild size="sm">
          <Link
            href={project.liveUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="mr-2 h-4 w-4" /> Live Demo
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
