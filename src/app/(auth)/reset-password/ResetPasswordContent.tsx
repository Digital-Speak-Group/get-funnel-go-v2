"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CircleX, LoaderCircle } from "lucide-react";
import { updatePasswordAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { AuthFallback } from "../_components/AuthFallback";
import { AuthField } from "../_components/AuthField";
import { FormAlert } from "../_components/FormAlert";
import { MIN_PASSWORD, confirmError, newPasswordError } from "../_components/validation";
import { authMessages } from "../messages";

const m = authMessages.reset;
const f = authMessages.fields;

type Phase = "verifying" | "form" | "invalid";
type FieldErrors = { password?: string; confirmPassword?: string };

interface Props {
  /** Recovery code from the email link, still to be exchanged for a session. */
  code: string | null;
  /** True when there is no code but the visitor is already signed in by a recovery link. */
  hasSession: boolean;
}

export function ResetPasswordContent({ code, hasSession }: Props) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>(code ? "verifying" : hasSession ? "form" : "invalid");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!code) return;
    let cancelled = false;

    fetch("/api/auth/callback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, type: "recovery" }),
    })
      .then((res) => res.json())
      .then((result: { error?: string }) => {
        if (cancelled) return;
        if (result.error) {
          setPhase("invalid");
          return;
        }
        // A code works once; drop it from the URL so a reload does not try it again.
        window.history.replaceState(null, "", "/reset-password");
        setPhase("form");
      })
      .catch(() => {
        if (!cancelled) setPhase("invalid");
      });

    return () => {
      cancelled = true;
    };
  }, [code]);

  function revalidate(next: { password?: string; confirmPassword?: string }) {
    const values = { password, confirmPassword, ...next };
    setFieldErrors((prev) => ({
      password: prev.password ? newPasswordError(values.password) : undefined,
      confirmPassword: prev.confirmPassword ? confirmError(values.password, values.confirmPassword) : undefined,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const errors: FieldErrors = {
      password: newPasswordError(password),
      confirmPassword: confirmError(password, confirmPassword),
    };
    setFieldErrors(errors);
    if (errors.password || errors.confirmPassword) return;

    setLoading(true);
    const result = await updatePasswordAction({ password });

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push("/app");
    router.refresh();
  }

  if (phase === "verifying") return <AuthFallback label={m.verifying} />;

  if (phase === "invalid") {
    return (
      <div className="space-y-6 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full border border-danger/25 bg-danger/10 text-danger">
          <CircleX className="size-6" aria-hidden="true" />
        </span>
        <div className="space-y-1.5" role="alert">
          <h1 className="text-h1 text-foreground">{m.invalidTitle}</h1>
          <p className="text-body text-muted-foreground">{m.invalid}</p>
        </div>
        <Button asChild size="lg" className="w-full">
          <Link href="/forgot-password">{m.requestNew}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-h1 text-foreground">{m.title}</h1>
        <p className="text-body text-muted-foreground">{m.description}</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {error && (
          <FormAlert>
            {error}{" "}
            <Link href="/forgot-password" className="underline underline-offset-4">
              {m.requestNew}
            </Link>
          </FormAlert>
        )}

        <AuthField
          id="password"
          label={f.password}
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            revalidate({ password: e.target.value });
          }}
          onBlur={() => password && setFieldErrors((prev) => ({ ...prev, password: newPasswordError(password) }))}
          placeholder={f.newPasswordPlaceholder}
          disabled={loading}
          error={fieldErrors.password}
          hint={f.passwordHint}
          hintMet={password.length >= MIN_PASSWORD}
        />

        <AuthField
          id="confirmPassword"
          label={f.confirmPassword}
          type="password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            revalidate({ confirmPassword: e.target.value });
          }}
          onBlur={() =>
            confirmPassword &&
            setFieldErrors((prev) => ({ ...prev, confirmPassword: confirmError(password, confirmPassword) }))
          }
          placeholder={f.passwordPlaceholder}
          disabled={loading}
          error={fieldErrors.confirmPassword}
        />

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <LoaderCircle className="animate-spin" aria-hidden="true" />
              {m.pending}
            </>
          ) : (
            <>
              {m.submit}
              <ArrowRight aria-hidden="true" />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
