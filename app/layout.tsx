import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastWrapper } from "@/components/ui/toast-wrapper";
import { ThemeInit } from "@/components/layout/theme-init";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
};

export const metadata: Metadata = {
  title: {
    default: "GymSync",
    template: "%s | GymSync",
  },
  description:
    "Train together. Track everything. Log workouts, schedule gym sessions with friends, and compete on weekly challenges.",
  keywords: ["gym", "workout tracker", "fitness", "gym sessions", "training"],
  openGraph: {
    title: "GymSync",
    description: "Train together. Track everything.",
    type: "website",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "GymSync",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      // SSR fallback: 'dark' ensures correct colors before ThemeInit runs on client.
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Runs synchronously before any CSS — prevents flash of wrong theme */}
        <ThemeInit />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <ToastWrapper />
      </body>
    </html>
  );
}
