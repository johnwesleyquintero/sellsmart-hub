"use client";

import { useEffect, useRef } from "react";

interface CommentsProps {
  postId: string;
  className?: string;
}

export function Comments({ postId, className }: CommentsProps) {
  const commentsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Add your preferred comments integration here (e.g., Giscus)
    const script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.setAttribute("data-repo", "your-repo");
    script.setAttribute("data-repo-id", "your-repo-id");
    script.setAttribute("data-category", "Comments");
    script.setAttribute("data-category-id", "your-category-id");
    script.setAttribute("data-mapping", "pathname");
    script.setAttribute("data-reactions-enabled", "1");
    script.setAttribute("data-emit-metadata", "0");
    script.setAttribute("data-theme", "light");
    script.setAttribute("data-lang", "en");
    script.crossOrigin = "anonymous";
    script.async = true;

    if (commentsRef.current) {
      commentsRef.current.appendChild(script);
    }

    return () => {
      if (commentsRef.current) {
        const giscusFrame = commentsRef.current.querySelector("iframe");
        if (giscusFrame) {
          commentsRef.current.removeChild(giscusFrame);
        }
      }
    };
  }, [postId]);

  return <div ref={commentsRef} className={className} />;
}
