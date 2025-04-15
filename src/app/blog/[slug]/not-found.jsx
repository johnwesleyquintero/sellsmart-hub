import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
export default function BlogNotFound() {
    return (<div className="container mx-auto px-4 py-32 text-center">
      <h1 className="text-4xl font-bold mb-4">Article Not Found</h1>
      <p className="text-muted-foreground mb-8 max-w-md mx-auto">
        The blog post you&apos;re looking for doesn&apos;t exist or has been
        moved.
      </p>
      <Button asChild>
        <Link href="/blog" className="flex items-center">
          <ArrowLeft className="mr-2 h-4 w-4"/>
          Back to Blog
        </Link>
      </Button>
    </div>);
}
