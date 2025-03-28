export function trackToolUsage(toolId: string, action: string) {
  // Track with Vercel Analytics
  if (typeof window !== "undefined" && "va" in window) {
    (window as any).va?.track("tool_usage", {
      toolId,
      action,
      timestamp: new Date().toISOString(),
    });
  }


}
