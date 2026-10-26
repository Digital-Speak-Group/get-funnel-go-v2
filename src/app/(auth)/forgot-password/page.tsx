import type { Metadata } from "next";
import { ForgotPasswordContent } from "./ForgotPasswordContent";

export const metadata: Metadata = { title: "Mot de passe oublié — GetFunnels" };

export default function ForgotPasswordPage() {
  return <ForgotPasswordContent />;
}
