'use client';

import { OptimizedImage } from '@/components/ui/optimized-image';
import { analytics } from '@/lib/analytics';
import { usePreferences } from '@/lib/preferences';
import { type StaticImageData } from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { useInView } from 'react-intersection-observer';

interface AdaptiveImageProps
  extends React.ComponentProps<typeof OptimizedImage> {
  src: string | StaticImageData;
  alt: string;
  className?: string;
  lowQualitySrc?: string;
  highQualitySrc?: string;
}

const processImagePath = (path: string | StaticImageData): string => {
  if (typeof path !== 'string') {
    return path.src;
  }

  if (path.startsWith('blob:')) {
    return path;
  }

  // Process dimensions only for string paths
  const dimensionMatch = path.match(/\d+x\d+/);
  return dimensionMatch
    ? path.replace(dimensionMatch[0], '').replace(/\/\//, '/')
    : path;
};

export function AdaptiveImage({
  src,
  lowQualitySrc,
  highQualitySrc,
  ...props
}: AdaptiveImageProps) {
  const preferences = usePreferences();
  const [currentSrc, setCurrentSrc] = useState(() => processImagePath(src));
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });
  const loadStartTime = useRef<number | null>(null);

  useEffect(() => {
    if (!inView) return;

    loadStartTime.current = performance.now();

    // Choose image quality based on preferences and connection
    const shouldLoadHighQuality =
      !preferences.prefersReducedData &&
      !preferences.connection.saveData &&
      preferences.connection.effectiveType !== 'slow-2g' &&
      preferences.connection.effectiveType !== '2g';

    // Choose format based on browser capabilities
    const { webp, avif } = preferences.browserCapabilities;

    let optimizedSrc = src;
    if (shouldLoadHighQuality && highQualitySrc) {
      optimizedSrc = highQualitySrc;
    } else if (lowQualitySrc) {
      optimizedSrc = lowQualitySrc;
    }

    // Process the optimized source
    const processedSrc = processImagePath(optimizedSrc);

    // Apply format conversion if supported
    if (typeof processedSrc === 'string') {
      if (avif && processedSrc.match(/\.(jpg|jpeg|png)$/i)) {
        setCurrentSrc(processedSrc.replace(/\.[^.]+$/, '.avif'));
      } else if (webp && processedSrc.match(/\.(jpg|jpeg|png)$/i)) {
        setCurrentSrc(processedSrc.replace(/\.[^.]+$/, '.webp'));
      } else {
        setCurrentSrc(processedSrc);
      }
    }
  }, [
    inView,
    src,
    lowQualitySrc,
    highQualitySrc,
    preferences.prefersReducedData,
    preferences.connection.saveData,
    preferences.connection.effectiveType,
    preferences.browserCapabilities.webp,
    preferences.browserCapabilities.avif,
  ]);

  const handleLoad = () => {
    if (loadStartTime.current) {
      const loadTime = performance.now() - loadStartTime.current;
      analytics.trackPerformance('image_load_time', loadTime);
    }
  };

  return (
    <div ref={ref}>
      {inView && (
        <OptimizedImage
          {...props}
          src={currentSrc}
          onLoad={handleLoad}
          loading="lazy"
        />
      )}
    </div>
  );
}
