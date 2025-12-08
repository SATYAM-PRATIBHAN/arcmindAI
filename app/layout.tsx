import type { Metadata } from "next";
import { DM_Sans, Geist_Mono } from "next/font/google";
import { Providers } from "../lib/providers";
import "./globals.css";
import "./prism.css";

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ArcMind AI - AI-Powered System Design Generator",
    template: "%s | ArcMind AI",
  },
  description:
    "Generate structured system designs using AI. Describe your requirements and get detailed architecture diagrams, components, and tech stacks powered by Gemini and Langchain.",
  keywords: [
    "AI system design",
    "architecture generator",
    "system design tool",
    "Gemini AI",
    "Langchain",
    "Next.js",
    "React",
    "MongoDB",
    "AI-powered design",
    "software architecture",
    "tech stack generator",
    "design generation",
    "AI assistant",
    "system modeling",
  ],
  authors: [{ name: "ArcMind AI Team" }],
  creator: "ArcMind AI",
  publisher: "ArcMind AI",
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/logos/logo.svg", type: "image/svg", sizes: "48x48" },
      { url: "/logos/fullLogo.svg", type: "image/svg", sizes: "192x192" },
    ],
    apple: [
      { url: "/logos/fullLogo.svg", sizes: "180x180" },
      { url: "/logos/logo.svg", sizes: "48x48" },
    ],
    shortcut: [{ url: "/logos/logo.svg", type: "image/svg" }],
  },
  openGraph: {
    title: "ArcMind AI - AI-Powered System Design Generator",
    description:
      "Generate structured system designs using AI. Describe your requirements and get detailed architecture diagrams, components, and tech stacks powered by Gemini and Langchain.",
    siteName: "ArcMind AI",
    images: [
      {
        url: "/ogimage.webp",
        width: 1200,
        height: 630,
        alt: "ArcMind AI - AI-Powered System Design Generator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ArcMind AI - AI-Powered System Design Generator",
    description:
      "Generate structured system designs using AI. Describe your requirements and get detailed architecture diagrams, components, and tech stacks powered by Gemini and Langchain.",
    images: ["/ogimage.webp"],
    creator: "@s_pratibhan",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
