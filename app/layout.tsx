import { ThemeProviderWrapper } from "@/app/ThemeProviderWrapper";
import { AccessibleHeader } from "@/components/ui/accessible-header";
import { cn } from "@/lib/utils";
import { type Metadata } from "next";
import { Inter as interFont } from "next/font/google";
import { type ReactNode } from "react";
import "./globals.css";

const inter = interFont({
  subsets: ["latin"],
  display: "swap",
  preload: true,
  fallback: ["system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  title: "Wesley Quintero | Data Analytics Innovator",
  description:
    "Data Analytics Innovator and Founder of Nebula Singularity, building tools that streamline workflows and provide valuable insights for Amazon sellers and e-commerce businesses.",
  keywords: [
    "Wesley Quintero",
    "Amazon Specialist",
    "Data Analytics",
    "E-commerce",
    "Amazon Seller Tools",
    "Portfolio",
    "Amazon SEO",
    "PPC Optimization",
    "Data Visualization",
    "SellSmart Hub",
    "DevFlowDB",
  ],
  authors: [
    { name: "Wesley Quintero", url: "https://github.com/johnwesleyquintero" },
  ],
  creator: "Wesley Quintero",
  publisher: "Wesley Quintero",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://wesleyquintero.vercel.app/",
    title: "Wesley Quintero | Data Analytics Innovator",
    description:
      "Data Analytics Innovator and Founder of Nebula Suite, building tools that streamline workflows and provide valuable insights.",
    siteName: "Wesley Quintero Portfolio",
    images: [
      {
        url: "https://wesleyquintero.vercel.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "Wesley Quintero Portfolio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Wesley Quintero | Data Analytics Innovator",
    description:
      "Data Analytics Innovator and Founder of Nebula Suite, building tools that streamline workflows and provide valuable insights.",
    images: ["https://wesleyquintero.vercel.app/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  manifest: "/site.webmanifest",
  metadataBase: new URL("https://wesleyquintero.vercel.app"),
  generator: "v0.dev",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.className
        )}
      >
        <ThemeProviderWrapper>
          <div className="relative flex min-h-screen flex-col">
            <AccessibleHeader />
            <main id="main-content" className="flex-1">
              {children}
            </main>
          </div>
        </ThemeProviderWrapper>
      </body>
    </html>
  );
}
