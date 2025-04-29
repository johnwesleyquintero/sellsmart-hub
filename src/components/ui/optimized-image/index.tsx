'use client';

import { monitor } from '@/lib/monitoring';
import type { ImageProps } from 'next/image';
import Image from 'next/image';
import { useEffect, useState } from 'react';

interface OptimizedImageProps
  extends Omit<ImageProps, 'onLoadingComplete' | 'onError'> {
  fallbackSrc?: string;
  onError?: (error: Error) => void;
}

const shimmer = (w: number, h: number) => `
<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#333" offset="20%" />
      <stop stop-color="#222" offset="50%" />
      <stop stop-color="#333" offset="70%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#333" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
</svg>`;

const toBase64 = (str: string) =>
  typeof window === 'undefined'
    ? Buffer.from(str).toString('base64')
    : window.btoa(str);

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  fallbackSrc = '/default-fallback.svg',
  onError,
  priority = false,
  className = '',
  ...props
}: OptimizedImageProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setImgSrc(src);
    setError(null);
    setLoading(true);
  }, [src]);

  const handleError = (error: Error) => {
    setError(error);
    setImgSrc(fallbackSrc);
    monitor.trackError(error, {
      component: 'OptimizedImage',
      src,
      fallbackSrc,
    });
    onError?.(error);
  };

  const imageProps = {
    src: imgSrc,
    alt,
    width,
    height,
    priority,
    ...props,
    className: `
      transition-opacity duration-300
      ${loading ? 'opacity-0' : 'opacity-100'}
      ${className}
    `,
    placeholder: 'blur',
    blurDataURL: `data:image/svg+xml;base64,${toBase64(shimmer(Number(width) || 0, Number(height) || 0))}`,
    onLoad: () => setLoading(false),
    onError: () => handleError(new Error('Image failed to load')),
  };

  if (error && !fallbackSrc) {
    return (
      <div
        role="img"
        aria-label={alt}
        className="bg-muted flex items-center justify-center"
        style={{ width, height }}
      >
        <span className="text-muted-foreground text-sm">
          Failed to load image
        </span>
      </div>
    );
  }

  type PlaceholderValue = 'blur' | 'empty' | `data:image/${string}`;

  const typedImageProps = {
    ...imageProps,
    placeholder: imageProps.placeholder as PlaceholderValue,
  };

  return <Image {...typedImageProps} />;
}
