import type { Metadata } from "next";
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
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
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
      // SSR fallback: render with 'dark' so the page never flashes white.
      // ThemeInit (inline script) overwrites this class before paint on the client.
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Must be first child of <head> — runs before any CSS is parsed */}
        <ThemeInit />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <ToastWrapper />
      </body>
    </html>
  );
}
