import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Github, Linkedin, Twitter, Mail, Triangle } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="container relative mx-auto px-4 py-32 md:py-48">
      <div className="grid items-center gap-12 md:grid-cols-2">
        <div className="space-y-8">
          <Badge
            variant="secondary"
            className="inline-flex items-center gap-1 rounded-full px-4 py-1.5"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75 duration-3000"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
            </span>
            Available for projects
          </Badge>

          <div className="animate-fadeIn">
            <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              I&apos;m{' '}
              <span className="bg-gradient-to-r from-primary via-purple-500 to-purple-600 bg-clip-text text-transparent animate-gradient bg-[length:200%_200%] hover:animate-none duration-5000">
                Wesley Quintero
              </span>
            </h1>
            <p className="text-xl text-muted-foreground md:text-2xl opacity-0 animate-[fadeIn_0.5s_ease-out_0.3s_forwards]">
              Helping Amazon sellers increase profits by 30-50% through
              <span className="font-semibold text-primary">
                {' '}
                data-driven automation
              </span>{' '}
              and
              <span className="font-semibold text-primary">
                {' '}
                AI-powered insights
              </span>
              .
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="group hover:scale-105 transition-transform duration-300 animate-pulse hover:animate-none bg-gradient-to-r from-primary to-purple-600 text-white shadow-lg hover:shadow-xl hover:from-primary/90 hover:to-purple-600/90"
            >
              <Link href="#projects">
                View Case Studies
                <span className="ml-2 group-hover:translate-x-1 transition-transform duration-300">
                  →
                </span>
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="hover:scale-105 transition-transform duration-300 hover:bg-primary hover:text-primary-foreground border-2 border-primary/20 hover:border-primary/50"
            >
              <Link href="#tools">Explore Tools</Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="lg"
              className="hover:scale-105 transition-transform duration-300 hover:bg-primary/10 hover:text-primary border border-primary/20 hover:border-primary/50"
            >
              <Link href="#contact">Get Free Consultation</Link>
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="https://github.com/johnwesleyquintero"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="rounded-full bg-background p-2 text-muted-foreground transition-all hover:text-primary hover:scale-110 hover:shadow-lg hover:shadow-primary/20 duration-300 hover:bg-primary/10 group hover:rotate-6"
            >
              <Github className="h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
            </Link>
            <Link
              href="https://linkedin.com/in/wesleyquintero"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="rounded-full bg-background p-2 text-muted-foreground transition-all hover:text-primary hover:scale-110 hover:shadow-lg hover:shadow-primary/20 duration-300 hover:bg-primary/10 hover:rotate-6 group"
            >
              <Linkedin className="h-5 w-5" />
            </Link>
            <Link
              href="https://twitter.com/wesleyquintero"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter"
              className="rounded-full bg-background p-2 text-muted-foreground transition-all hover:text-primary hover:scale-110 hover:shadow-lg hover:shadow-primary/20 duration-300 hover:bg-primary/10 hover:rotate-6 group"
            >
              <Twitter className="h-5 w-5" />
            </Link>
            <Link
              href="mailto:johnwesleyquintero@gmail.com"
              aria-label="Email"
              className="rounded-full bg-background p-2 text-muted-foreground transition-all hover:text-primary hover:scale-110 hover:shadow-lg hover:shadow-primary/20 duration-300 hover:bg-primary/10 hover:rotate-6 group"
            >
              <Mail className="h-5 w-5" />
            </Link>
            <Link
              href="https://sellsmart-pro.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="SellSmart Pro"
              className="rounded-full bg-background p-2 text-muted-foreground transition-all hover:text-primary hover:scale-110 hover:shadow-lg hover:shadow-primary/20 duration-300 hover:bg-primary/10 hover:rotate-6 group"
            >
              <Triangle className="h-5 w-5" />
            </Link>
          </div>
        </div>

        <div className="relative mx-auto aspect-square w-full max-w-md animate-float hover:animate-none">
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/20 to-purple-500/20 blur-3xl animate-gradient bg-[length:200%_200%] hover:animate-none"></div>
          <div className="relative h-full overflow-hidden rounded-3xl border bg-background/50 shadow-xl backdrop-blur-sm hover:shadow-2xl transition-all duration-500 group">
            <Image
              priority
              quality={90}
              className="rounded-lg shadow-xl transition-transform duration-300 hover:scale-105 object-cover hover:scale-105 transition-transform duration-500 group-hover:rotate-3 hover:animate-none"
              src="https://avatars.githubusercontent.com/u/190981914?v=4"
              alt="Wesley Quintero"
              fill
            />
          </div>
        </div>
      </div>
    </section>
  );
}
