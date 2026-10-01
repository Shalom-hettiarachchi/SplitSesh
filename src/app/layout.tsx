import type { Metadata } from "next";
import { Bebas_Neue, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const display = Bebas_Neue({ subsets: ["latin"], weight: "400", variable: "--font-logo" });

export const metadata: Metadata = {
  title: "SplitSesh — Shared Consumption Tracker",
  description: "Session logger and fair expense splitting for shared packs and batches.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${display.variable}`}>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
