"use client";

import { cn } from "@/lib/utils";
import * as React from "react";

export interface SkipLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  contentId?: string;
}

const SkipLink = React.forwardRef<HTMLAnchorElement, SkipLinkProps>(
  (
    {
      className,
      contentId = "main-content",
      children = "Skip to main content",
      ...props
    },
    ref,
  ) => {
    return (
      <a
        ref={ref}
        href={`#${contentId}`}
        className={cn(
          "sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50",
          "focus:block focus:rounded-md focus:bg-background focus:p-4 focus:shadow-md",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          className,
        )}
        {...props}
      >
        {children}
      </a>
    );
  },
);

SkipLink.displayName = "SkipLink";

export { SkipLink };
