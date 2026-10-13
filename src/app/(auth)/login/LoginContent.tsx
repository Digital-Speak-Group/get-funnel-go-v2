"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, KeyRound, LoaderCircle, Mail } from "lucide-react";
import { signInAction } from "@/app/(auth)/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AuthField } from "../_components/AuthField";
import { FormAlert } from "../_components/FormAlert";
import { emailError, passwordRequiredError } from "../_components/validation";
import { authMessages } from "../messages";

const m = authMessages.login;
const f = authMessages.fields;

type FieldErrors = { email?: string; password?: string };

export function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/app";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const errors: FieldErrors = { email: emailError(email), password: passwordRequiredError(password) };
    setFieldErrors(errors);
    if (errors.email || errors.password) return;

    setLoading(true);

    const result = await signInAction({ email, password });

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-h1 text-foreground">{m.title}</h1>
        <p className="text-body text-muted-foreground">{m.description}</p>
      </div>

      <Tabs defaultValue="password">
        <TabsList aria-label={m.methodsLabel} className="grid w-full grid-cols-2">
          <TabsTrigger value="password">
            <KeyRound aria-hidden="true" />
            {m.tabPassword}
          </TabsTrigger>
          {/* No magic-link sign-in action exists yet; the tab is a visible, disabled seam. */}
          <TabsTrigger value="magic-link" disabled>
            <Mail aria-hidden="true" />
            {m.tabMagicLink}
            <Badge>{m.soon}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="password" className="mt-6">
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
                if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: emailError(e.target.value) }));
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
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
              }}
              placeholder={f.passwordPlaceholder}
              disabled={loading}
              error={fieldErrors.password}
              labelAside={
                <Link
                  href="/forgot-password"
                  className="rounded-sm text-small text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {m.forgot}
                </Link>
              }
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
        </TabsContent>
      </Tabs>

      <p className="text-center text-small text-muted-foreground">
        {m.noAccount}{" "}
        <Link
          href={`/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          className="font-medium text-brand underline-offset-4 hover:underline"
        >
          {m.signup}
        </Link>
      </p>
    </div>
  );
}
