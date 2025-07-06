import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import GameProviderWrapper from "@/components/GameProviderWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Re-Prompt That",
  description: "The ultimate prompt writing challenge.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head> <link rel="icon" href="/dog.gif" type="image/gif" />
        </head>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <GameProviderWrapper>
          {children}
          <Toaster />
        </GameProviderWrapper>
      </body>
    </html>
  );
}
