import type { Metadata } from "next";
import { marketingMessages } from "./messages";
import { MarketingFooter } from "./sections/MarketingFooter";
import { MarketingHeader } from "./sections/MarketingHeader";

export const metadata: Metadata = {
  title: marketingMessages.meta.title,
  description: marketingMessages.meta.description,
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <MarketingHeader />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}
