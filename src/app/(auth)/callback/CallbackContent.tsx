"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CircleCheck, CircleX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AuthFallback } from "../_components/AuthFallback";
import { authMessages } from "../messages";

const m = authMessages.callback;

export function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/app";
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    const type = searchParams.get("type");
    const msg = searchParams.get("message");
    const err = searchParams.get("error");

    if (err) {
      setError(err);
      setLoading(false);
      return;
    }

    if (msg) {
      setMessage(msg);
      setLoading(false);
      return;
    }

    if (code && type === "signup") {
      // Exchange code for session using PKCE flow
      fetch(`/api/auth/callback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, type: "signup" }),
      })
        .then((res) => res.json())
        .then((result) => {
          if (result.error) {
            setError(result.error);
          } else {
            setMessage(m.confirmed);
            setTimeout(() => {
              router.push(`/onboarding?callbackUrl=${encodeURIComponent(callbackUrl)}`);
            }, 1500);
          }
        })
        .finally(() => {
          setLoading(false);
        });
    } else if (code && type === "recovery") {
      setMessage(m.recovery);
      setLoading(false);
    } else {
      // An unusable link is an error state, not a success message.
      setError(m.invalidLink);
      setLoading(false);
    }
  }, [router, searchParams, callbackUrl]);

  if (loading) return <AuthFallback label={m.processing} />;

  const success = Boolean(message);
  const Icon = success ? CircleCheck : CircleX;

  return (
    <div className="space-y-6 text-center">
      <span
        className={cn(
          "mx-auto flex size-12 items-center justify-center rounded-full border",
          success ? "border-success/25 bg-success/10 text-success" : "border-danger/25 bg-danger/10 text-danger"
        )}
      >
        <Icon className="size-6" aria-hidden="true" />
      </span>

      <div className="space-y-1.5" role={success ? "status" : "alert"}>
        <h1 className="text-h1 text-foreground">{success ? m.successTitle : m.errorTitle}</h1>
        <p className="text-body text-muted-foreground">{message || error || m.genericError}</p>
      </div>

      {!success && (
        <Button asChild variant="secondary" size="lg" className="w-full">
          <Link href="/login">{m.backToLogin}</Link>
        </Button>
      )}
    </div>
  );
}
