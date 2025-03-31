'use client';

import { HTMLAttributes, useId } from 'react';
import styles from './logo.module.css';
import { cn } from '@/lib/styling-utils';

interface LogoProps extends HTMLAttributes<SVGElement> {
  className?: string;
}

export default function Logo({ className, ...props }: LogoProps) {
  const uid = useId();
  const gradientId = `gradient-${uid}`;
  const shadowId = `shadow-${uid}`;

  return (
    <svg
      className={cn(className, styles.logo)}
      viewBox="0 0 40 40"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--logo-color-1, #3245ff)">
            <animate
              attributeName="stop-color"
              values="var(--logo-color-1, #3245ff);var(--logo-color-2, #bc52ee);var(--logo-color-1, #3245ff)"
              dur="5s"
              repeatCount="indefinite"
            />
          </stop>
          <stop offset="100%" stopColor="var(--logo-color-2, #bc52ee)">
            <animate
              attributeName="stop-color"
              values="var(--logo-color-2, #bc52ee);var(--logo-color-1, #3245ff);var(--logo-color-2, #bc52ee)"
              dur="5s"
              repeatCount="indefinite"
            />
          </stop>
        </linearGradient>
        <filter id={shadowId}>
          <feDropShadow dx="2" dy="2" stdDeviation="2" floodColor="rgba(0,0,0,0.3)" />
        </filter>
      </defs>

      <path
        fill={`url(#${gradientId})`}
        d="M20 5L35 35H5L20 5Z"
        className={styles.logoMark}
        filter={`url(#${shadowId})`}
      />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M25 15l10 15-15-10-10 15"
        className={styles.dynamicLine}
      />
    </svg>
  );
}
