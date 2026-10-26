import { Suspense } from "react";
import { AuthFallback } from "../_components/AuthFallback";
import { CallbackContent } from "./CallbackContent";

export default function CallbackPage() {
  return (
    <Suspense fallback={<AuthFallback />}>
      <CallbackContent />
    </Suspense>
  );
}
