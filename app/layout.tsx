import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { ToastWrapper } from "@/components/ui/toast-wrapper";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0e0e10" },
    { media: "(prefers-color-scheme: light)", color: "#f7f7f8" },
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
    statusBarStyle: "black-translucent",
    title: "GymSync",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Read theme from cookie server-side — no client script needed, no FOUC.
  // Falls back to 'dark' (app default) if no cookie is set yet.
  const cookieStore = await cookies();
  const theme = cookieStore.get('gymsync-theme')?.value === 'light' ? 'light' : 'dark';

  return (
    <html
      lang="en"
      className={`${plusJakarta.variable} ${geistMono.variable} ${theme} h-full`}
      suppressHydrationWarning
    >
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="GymSync" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512x512.png" />
      </head>
      <body className="min-h-full flex flex-col antialiased">
        {children}
        <Suspense fallback={null}>
          <ToastWrapper />
        </Suspense>
      </body>
    </html>
  );
}
