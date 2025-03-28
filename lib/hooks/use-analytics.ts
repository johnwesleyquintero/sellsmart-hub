import { useCallback } from "react";

type EventName = "tool_selected" | "tool_action" | "export_data";
type EventProperties = Record<string, string | number | boolean>;

export function useAnalytics() {
  const trackEvent = useCallback(
    (name: EventName, properties?: EventProperties) => {
      // Integration with your analytics platform (e.g., Vercel Analytics)
      if (typeof window !== "undefined" && "va" in window) {
        (window as any).va?.track(name, properties);
      }
    },
    [],
  );

  return { trackEvent };
}
