'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

interface OptimizedImageProps
  extends Omit<
    React.ComponentProps<typeof Image>,
    'onLoadingComplete' | 'blurDataURL'
  > {
  fallbackSrc?: string;
}

export function OptimizedImage({
  src,
  alt,
  fallbackSrc = '/default-fallback.svg',
  priority = false,
  loading = 'lazy',
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  className,
  ...props
}: OptimizedImageProps) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Reset error state if src changes
  useEffect(() => {
    setError(false);
    setLoaded(false);
  }, [src]);

  return (
    <div className="relative overflow-hidden">
      <Image
        src={error ? fallbackSrc : src}
        alt={alt}
        priority={priority}
        loading={loading}
        sizes={sizes}
        className={`
          transition-opacity duration-300
          ${loaded ? 'opacity-100' : 'opacity-0'}
          ${className || ''}
        `}
        onError={() => setError(true)}
        onLoad={() => setLoaded(true)}
        {...props}
      />
      {!loaded && !error && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
    </div>
  );
}
