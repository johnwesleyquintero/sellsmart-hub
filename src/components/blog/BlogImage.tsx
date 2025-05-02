'use client';

import Image from 'next/image';

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
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={() => console.error('Error loading image')}
      priority={priority}
      quality={quality}
    />
  );
}
