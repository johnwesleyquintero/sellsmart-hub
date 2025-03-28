import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

export interface IntegrationConfig {
  analyticsEnabled: boolean;
  speedInsightsEnabled: boolean;
  newsletterProvider: "mailchimp" | "convertkit" | null;
  commentsProvider: "giscus" | "disqus" | null;
}

export const defaultConfig: IntegrationConfig = {
  analyticsEnabled: true,
  speedInsightsEnabled: true,
  newsletterProvider: "convertkit",
  commentsProvider: "giscus",
};

export const integrations = {
  Analytics,
  SpeedInsights,
  // Add other integrations here
};
