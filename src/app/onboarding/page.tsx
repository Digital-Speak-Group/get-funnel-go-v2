import { Suspense } from "react";
import { LoaderCircle } from "lucide-react";
import { OnboardingContent } from "./OnboardingContent";
import { onboardingMessages as m } from "./messages";

function OnboardingFallback() {
  return (
    <div role="status" className="flex flex-col items-center gap-3 py-12 text-center">
      <LoaderCircle className="size-6 animate-spin text-faint" aria-hidden="true" />
      <p className="text-small text-muted-foreground">{m.loading}</p>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<OnboardingFallback />}>
      <OnboardingContent />
    </Suspense>
  );
}
