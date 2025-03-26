import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Github, Linkedin, Twitter, Mail, ArrowRight, Sparkles } from "lucide-react"

export default function HeroSection() {
  return (
    <section className="container relative mx-auto px-4 py-32 md:py-48">
      <div className="grid items-center gap-12 md:grid-cols-2">
        <div className="space-y-8">
          <Badge variant="secondary" className="inline-flex items-center gap-1 rounded-full px-4 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
            </span>
            Available for projects
          </Badge>

          <div>
            <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              I'm{" "}
              <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                Wesley Quintero
              </span>
            </h1>
            <p className="text-xl text-muted-foreground md:text-2xl">
              Data-Driven Amazon & E-commerce Specialist. Helping Brands Scale with Insights, Automation & AI.
              <Sparkles className="inline-block h-5 w-5 text-yellow-500" />
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            <Button asChild size="lg" className="group">
              <Link href="#projects">
                View My Work
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="#contact">Get in Touch</Link>
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="https://github.com/johnwesleyquintero"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-background p-2 text-muted-foreground transition-colors hover:text-primary"
            >
              <Github className="h-5 w-5" />
            </Link>
            <Link
              href="https://linkedin.com/in/wesleyquintero"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-background p-2 text-muted-foreground transition-colors hover:text-primary"
            >
              <Linkedin className="h-5 w-5" />
            </Link>
            <Link
              href="https://twitter.com/wesleyquintero"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-background p-2 text-muted-foreground transition-colors hover:text-primary"
            >
              <Twitter className="h-5 w-5" />
            </Link>
            <Link
              href="mailto:johnwesleyquintero@gmail.com"
              className="rounded-full bg-background p-2 text-muted-foreground transition-colors hover:text-primary"
            >
              <Mail className="h-5 w-5" />
            </Link>
          </div>
        </div>

        <div className="relative mx-auto aspect-square w-full max-w-md">
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/20 to-purple-500/20 blur-3xl"></div>
          <div className="relative h-full overflow-hidden rounded-3xl border bg-background/50 shadow-xl backdrop-blur-sm">
            <Image
              src="https://avatars.githubusercontent.com/u/190981914?v=4"
              alt="Wesley Quintero"
              width={600}
              height={600}
              className="object-cover"
              priority
              loading="eager"
              fetchPriority="high"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
            />
          </div>
        </div>
      </div>
    </section>
  )
}

