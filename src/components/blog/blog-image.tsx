'use client';

import { OptimizedImage } from '@/components/ui/optimized-image';
import { logger } from '@/lib/logger';

export interface BlogImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
}

export function BlogImage({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
}: Readonly<BlogImageProps>) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
      quality={90}
      fallbackSrc="/default-fallback.svg"
      onError={(error) => {
        logger.error('Blog image failed to load:', {
          error,
          src,
          alt,
        });
      }}
    />
  );
}

export default BlogImage;
