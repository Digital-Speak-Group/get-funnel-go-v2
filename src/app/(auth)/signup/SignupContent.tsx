"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { signUpAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { AuthField } from "../_components/AuthField";
import { FormAlert } from "../_components/FormAlert";
import { MIN_PASSWORD, confirmError, emailError, newPasswordError } from "../_components/validation";
import { authMessages } from "../messages";

const m = authMessages.signup;
const f = authMessages.fields;

type FieldErrors = { email?: string; password?: string; confirmPassword?: string };

export function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/app";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function revalidate(next: Partial<Record<keyof FieldErrors, string>>) {
    const values = { email, password, confirmPassword, ...next };
    setFieldErrors((prev) => ({
      email: prev.email ? emailError(values.email) : undefined,
      password: prev.password ? newPasswordError(values.password) : undefined,
      confirmPassword: prev.confirmPassword ? confirmError(values.password, values.confirmPassword) : undefined,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const errors: FieldErrors = {
      email: emailError(email),
      password: newPasswordError(password),
      confirmPassword: confirmError(password, confirmPassword),
    };
    setFieldErrors(errors);
    if (errors.email || errors.password || errors.confirmPassword) return;

    setLoading(true);

    const result = await signUpAction({ email, password });

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push(`/callback?message=${encodeURIComponent(m.checkEmail)}&callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-h1 text-foreground">{m.title}</h1>
        <p className="text-body text-muted-foreground">{m.description}</p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {error && <FormAlert>{error}</FormAlert>}

        <AuthField
          id="email"
          label={f.email}
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            revalidate({ email: e.target.value });
          }}
          onBlur={() => email && setFieldErrors((prev) => ({ ...prev, email: emailError(email) }))}
          placeholder={f.emailPlaceholder}
          disabled={loading}
          error={fieldErrors.email}
        />

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

      <p className="text-center text-small text-muted-foreground">
        {m.hasAccount}{" "}
        <Link
          href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          className="font-medium text-brand underline-offset-4 hover:underline"
        >
          {m.login}
        </Link>
      </p>
    </div>
  );
}
