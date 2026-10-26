import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { productTokens } from "@/lib/design/tokens";
import "@/styles/globals.css";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GetFunnels",
  description: "Générez des decks de vente présentables en minutes",
};

export const viewport: Viewport = {
  themeColor: productTokens.bg,
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        {children}
      </body>
    </html>
  );
}
