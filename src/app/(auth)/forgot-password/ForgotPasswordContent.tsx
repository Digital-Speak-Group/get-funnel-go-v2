"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, LoaderCircle, MailCheck } from "lucide-react";
import { resetPasswordRequestAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { AuthField } from "../_components/AuthField";
import { FormAlert } from "../_components/FormAlert";
import { emailError } from "../_components/validation";
import { authMessages } from "../messages";

const m = authMessages.forgot;
const f = authMessages.fields;

export function ForgotPasswordContent() {
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const invalid = emailError(email);
    setFieldError(invalid);
    if (invalid) return;

    setLoading(true);
    const result = await resetPasswordRequestAction({ email });
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="space-y-6 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-full border border-success/25 bg-success/10 text-success">
          <MailCheck className="size-6" aria-hidden="true" />
        </span>
        <div className="space-y-1.5" role="status">
          <h1 className="text-h1 text-foreground">{m.sentTitle}</h1>
          <p className="text-body text-muted-foreground">{m.sent}</p>
        </div>
        <Button asChild variant="secondary" size="lg" className="w-full">
          <Link href="/login">{m.back}</Link>
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
            if (fieldError) setFieldError(emailError(e.target.value));
          }}
          onBlur={() => email && setFieldError(emailError(email))}
          placeholder={f.emailPlaceholder}
          disabled={loading}
          error={fieldError}
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
        <Link href="/login" className="font-medium text-brand underline-offset-4 hover:underline">
          {m.back}
        </Link>
      </p>
    </div>
  );
}
