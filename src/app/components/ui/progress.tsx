'use client';

import * as React from 'react';

import { cn } from '@/lib/utils';

const Progress = React.forwardRef<
  HTMLProgressElement,
  React.HTMLAttributes<HTMLProgressElement>
>(({ className, value, max, ...props }, ref) => {
  return (
    <progress
      ref={ref}
      className={cn(
        'h-2 w-full appearance-none overflow-hidden rounded-full bg-secondary',
        className,
      )}
      value={value}
      max={max}
      {...props}
    />
  );
});
Progress.displayName = 'Progress';

export { Progress };
