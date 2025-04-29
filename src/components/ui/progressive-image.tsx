'use client';

import Image from 'next/image';
import React from 'react';

interface ProgressiveImageProps
  extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt?: string;
  width?: number | string;
  height?: number | string;
}

export function ProgressiveImage({
  src,
  alt = '',
  width,
  height,
  ...props
}: ProgressiveImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={typeof width === 'string' ? parseInt(width, 10) : width}
      height={typeof height === 'string' ? parseInt(height, 10) : height}
      {...props}
    />
  );
}
