import { Suspense } from "react";
import { AuthFallback } from "../_components/AuthFallback";
import { SignupContent } from "./SignupContent";

export default function SignupPage() {
  return (
    <Suspense fallback={<AuthFallback />}>
      <SignupContent />
    </Suspense>
  );
}
