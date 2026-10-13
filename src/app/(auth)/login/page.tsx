import { Suspense } from "react";
import { AuthFallback } from "../_components/AuthFallback";
import { LoginContent } from "./LoginContent";

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthFallback />}>
      <LoginContent />
    </Suspense>
  );
}
