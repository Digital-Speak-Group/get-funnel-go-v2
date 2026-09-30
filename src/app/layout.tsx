import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "GetFunnels",
  description: "Générez des decks de vente présentables en minutes",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        {children}
      </body>
    </html>
  );
}