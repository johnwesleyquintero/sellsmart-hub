"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import * as React from "react";

export interface AccessibleButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

const AccessibleButton = React.forwardRef<
  HTMLButtonElement,
  AccessibleButtonProps
>(({ className, children, loading, loadingText, disabled, ...props }, ref) => {
  const isDisabled = disabled || loading;

  return (
    <Button
      ref={ref}
      className={cn(className)}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText || children}
        </>
      ) : (
        children
      )}
    </Button>
  );
});

AccessibleButton.displayName = "AccessibleButton";

export { AccessibleButton };
