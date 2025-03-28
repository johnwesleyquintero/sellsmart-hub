"use client";

import { useCallback, useEffect } from "react";

type KeyboardNavigationOptions = {
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onEnter?: () => void;
  onEscape?: () => void;
  onSpace?: () => void;
  onTab?: (event: KeyboardEvent) => void;
  enabled?: boolean;
};

export const useKeyboardNavigation = ({
  onArrowUp,
  onArrowDown,
  onArrowLeft,
  onArrowRight,
  onEnter,
  onEscape,
  onSpace,
  onTab,
  enabled = true,
}: KeyboardNavigationOptions) => {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      switch (event.key) {
        case "ArrowUp":
          event.preventDefault();
          onArrowUp?.();
          break;
        case "ArrowDown":
          event.preventDefault();
          onArrowDown?.();
          break;
        case "ArrowLeft":
          event.preventDefault();
          onArrowLeft?.();
          break;
        case "ArrowRight":
          event.preventDefault();
          onArrowRight?.();
          break;
        case "Enter":
          event.preventDefault();
          onEnter?.();
          break;
        case "Escape":
          event.preventDefault();
          onEscape?.();
          break;
        case " ":
          event.preventDefault();
          onSpace?.();
          break;
        case "Tab":
          onTab?.(event);
          break;
      }
    },
    [
      enabled,
      onArrowUp,
      onArrowDown,
      onArrowLeft,
      onArrowRight,
      onEnter,
      onEscape,
      onSpace,
      onTab,
    ],
  );

  useEffect(() => {
    if (enabled) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [enabled, handleKeyDown]);
};
