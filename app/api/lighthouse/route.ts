import { NextResponse } from "next/server";

interface LighthouseMetric {
  id: string;
  title: string;
  description: string;
  score: number | null;
  displayValue?: string;
  numericValue?: number;
  numericUnit?: string;
}

export async function GET() {
  try {
    // In a real implementation, this would fetch data from Lighthouse API or a database
    // For now, we'll simulate a delay and return sample data
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const metrics: Record<string, LighthouseMetric> = {
      "first-contentful-paint": {
        id: "first-contentful-paint",
        title: "First Contentful Paint",
        description:
          "First Contentful Paint marks the time at which the first text or image is painted.",
        score: Math.random() * 0.3 + 0.7, // Random score between 0.7 and 1.0
        numericValue: Math.floor(Math.random() * 500 + 500),
        numericUnit: "millisecond",
        displayValue: "0.8 s",
      },
      "largest-contentful-paint": {
        id: "largest-contentful-paint",
        title: "Largest Contentful Paint",
        description:
          "Largest Contentful Paint marks the time at which the largest text or image is painted.",
        score: Math.random() * 0.3 + 0.7,
        numericValue: Math.floor(Math.random() * 500 + 800),
        numericUnit: "millisecond",
        displayValue: "1.2 s",
      },
      "speed-index": {
        id: "speed-index",
        title: "Speed Index",
        description:
          "Speed Index shows how quickly the contents of a page are visibly populated.",
        score: Math.random() * 0.5 + 0.5,
        numericValue: Math.floor(Math.random() * 1000 + 2000),
        numericUnit: "millisecond",
        displayValue: "2.8 s",
      },
      "is-on-https": {
        id: "is-on-https",
        title: "Uses HTTPS",
        description:
          "All sites should be protected with HTTPS, even ones that don't handle sensitive data.",
        score: 1,
        displayValue: "Yes",
      },
      viewport: {
        id: "viewport",
        title: "Has viewport meta tag",
        description:
          "A viewport meta tag optimizes your app for mobile screen sizes.",
        score: 1,
        displayValue: "Yes",
      },
    };

    return NextResponse.json({ metrics });
  } catch (error) {
    console.error("Error fetching Lighthouse metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch Lighthouse metrics" },
      { status: 500 },
    );
  }
}
