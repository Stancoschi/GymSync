import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastWrapper } from "@/components/ui/toast-wrapper";

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
  description: "Train together. Track everything. Log workouts, schedule gym sessions with friends, and compete on weekly challenges.",
  keywords: ["gym", "workout tracker", "fitness", "gym sessions", "training"],
  openGraph: {
    title: "GymSync",
    description: "Train together. Track everything.",
    type: "website",
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
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <ToastWrapper />
      </body>
    </html>
  );
}
