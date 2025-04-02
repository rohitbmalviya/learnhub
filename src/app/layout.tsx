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

// Update to the real domain when deployed
const siteUrl = "https://learnhub.example.com";

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
    images: [{ url: "/icon-512.png", width: 512, height: 512, alt: "LearnHub logo" }],
  },
  twitter: {
    card: "summary",
    title: "LearnHub — Online Learning Platform",
    description:
      "Unlock your potential with LearnHub — world-class courses, expert instructors, and a community of learners.",
    images: ["/icon-512.png"],
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
