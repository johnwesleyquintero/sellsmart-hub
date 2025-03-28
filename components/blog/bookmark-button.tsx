"use client";

import { Button } from "@/components/ui/button";
import { Bookmark } from "lucide-react";
import { useState } from "react";

interface BookmarkButtonProps {
  postId: string;
}

export function BookmarkButton({ postId }: BookmarkButtonProps) {
  const [isBookmarked, setIsBookmarked] = useState(false);

  const toggleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    // Save to localStorage
    const bookmarks = JSON.parse(localStorage.getItem("bookmarks") || "[]");
    if (isBookmarked) {
      localStorage.setItem(
        "bookmarks",
        JSON.stringify(bookmarks.filter((id: string) => id !== postId))
      );
    } else {
      localStorage.setItem("bookmarks", JSON.stringify([...bookmarks, postId]));
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className={isBookmarked ? "text-primary" : "text-muted-foreground"}
      onClick={toggleBookmark}
    >
      <Bookmark className="h-4 w-4" />
    </Button>
  );
}
