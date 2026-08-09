import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Resolved at build time: an explicit custom domain if set, else the stable
// Vercel production domain, else the per-deployment URL (preview builds),
// else local dev. This has to be an absolute URL — link-preview scrapers
// (WhatsApp, Slack, LinkedIn) will not resolve a relative og:image.
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "LearnHub — Online Learning Platform",
    template: "%s | LearnHub",
  },
  description:
    "Unlock your potential with LearnHub — world-class courses, expert instructors, and a community of learners.",
  applicationName: "LearnHub",
  keywords: [
    "online courses",
    "e-learning platform",
    "online learning",
    "video courses",
    "quizzes",
    "certificates",
    "expert instructors",
    "learn programming",
  ],
  authors: [{ name: "LearnHub" }],
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "LearnHub",
    title: "LearnHub — Online Learning Platform",
    description:
      "Unlock your potential with LearnHub — world-class courses, expert instructors, and a community of learners.",
    // Image comes from src/app/opengraph-image.tsx (1200x630). Do not add an
    // `images` key here — an explicit entry overrides the file convention.
  },
  twitter: {
    card: "summary_large_image",
    title: "LearnHub — Online Learning Platform",
    description:
      "Unlock your potential with LearnHub — world-class courses, expert instructors, and a community of learners.",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#171310" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <Toaster richColors position="bottom-right" />
      </body>
    </html>
  );
}
