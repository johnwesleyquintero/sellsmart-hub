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
    console.error(`Failed to load image: ${src}`);
    setError(true);
  };

  const handleLoad = () => {
    console.log(`Loaded image: ${src}`);
  };

  return (
    <Image
      src={error ? '/default-fallback.svg' : src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={handleError}
      onLoad={handleLoad}
    />
  );
}
