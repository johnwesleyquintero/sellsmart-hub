import { cn } from "@/lib/utils"
import type { Metadata } from "next"
import dynamic from 'next/dynamic'
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})


import type React from "react"
import { ThemeProviderWrapper } from "./ThemeProviderWrapper"
import "./globals.css"
const Header = dynamic(() => import('@/components/header'), { loading: () => <div className="h-16" /> })
const Footer = dynamic(() => import('@/components/footer'), { loading: () => <div className="h-24" /> })



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
  authors: [{ name: "Wesley Quintero", url: "https://github.com/johnwesleyquintero" }],
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
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  metadataBase: new URL("https://wesleyquintero.vercel.app"),
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased")}
        suppressHydrationWarning={true}>
        <ThemeProviderWrapper>
          {children}
        </ThemeProviderWrapper>
      </body>
    </html>
  )
}
