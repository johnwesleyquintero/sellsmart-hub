'use client';

import Image from 'next/image';
import { useState } from 'react';

type BlogImageProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
};

export function BlogImage({
  src,
  alt,
  width,
  height,
  className,
}: BlogImageProps) {
  const [error, setError] = useState(false);

  const handleError = () => {
    const cleanSrc = src.replace(/^\/public/, '');
    console.error(`Failed to load image: ${cleanSrc}`);
    setError(true);
  };

  const handleLoad = () => {
    console.log(`Loaded image: ${src}`);
  };

  return (
    <Image
      src={error ? '/default-fallback.svg' : src.replace(/^\/public/, '')}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={handleError}
      onLoad={handleLoad}
    />
  );
}
