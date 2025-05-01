'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

type BlogImageProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  quality?: number;
};

export function BlogImage({
  src,
  alt,
  width,
  height,
  className,
  priority,
  quality,
}: Readonly<BlogImageProps>) {
  const [error, setError] = useState(false);

  // Clean useEffect implementation after fixes
  useEffect(() => {
    let img: HTMLImageElement | null = null;

    if (typeof window !== 'undefined' && src) {
      setError(false);
      img = document.createElement('img');
      img.width = width;
      img.height = height;
      img.src = src;
      img.onload = () => setError(false);
      img.onerror = () => setError(true);
    } else {
      setError(true);
    }

    return () => {
      if (img) {
        img.onload = null;
        img.onerror = null;
      }
    };
  }, [src, width, height]);

  return (
    <Image
      src={error ? '/default-fallback.svg' : src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={() => setError(true)}
      priority={priority}
      quality={quality}
    />
  );
}
