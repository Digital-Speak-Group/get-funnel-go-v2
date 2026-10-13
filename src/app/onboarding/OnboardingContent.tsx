"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, CircleCheck, LoaderCircle } from "lucide-react";
import { createOrgAction } from "@/app/onboarding/actions";
import { AuthField } from "@/app/(auth)/_components/AuthField";
import { FormAlert } from "@/app/(auth)/_components/FormAlert";
import { Button } from "@/components/ui/button";
import { OnboardingStepper } from "./OnboardingStepper";
import { SlugField } from "./SlugField";
import { onboardingMessages as m } from "./messages";

const SLUG_PATTERN = /^[a-z0-9-]{2,50}$/;

function generateSlug(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 50);
}

function nameError(name: string) {
  const length = name.trim().length;
  return length >= 2 && length <= 60 ? undefined : m.name.errorLength;
}

function slugError(slug: string) {
  return SLUG_PATTERN.test(slug) ? undefined : m.slug.errorFormat;
}

/**
 * Onboarding stepper over the existing org action (name + slug): 1 name, 2 slug,
 * 3 confirmation while redirecting. Brand colour / first template are not supported by
 * `createOrgAction` yet.
 */
export function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/app";
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [fieldError, setFieldError] = useState<string>();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setName(value);
    if (fieldError) setFieldError(nameError(value));
    if (!slug || slug === generateSlug(name)) {
      setSlug(generateSlug(value));
    }
  }

  function goToSlug(e: React.FormEvent) {
    e.preventDefault();
    const invalid = nameError(name);
    setFieldError(invalid);
    if (!invalid) setStep(1);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const invalid = slugError(slug);
    setFieldError(invalid);
    if (invalid) return;

    setLoading(true);

    const result = await createOrgAction({ name, slug });

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setStep(2);
    router.push(callbackUrl);
    router.refresh();
  }

  const current = m.steps[step];

  return (
    <div className="space-y-8">
      <OnboardingStepper current={step} />

      <div key={step} className="animate-fade-in space-y-6 motion-reduce:animate-none">
        {step === 2 && <CircleCheck className="size-10 text-success" aria-hidden="true" />}
        <div className="space-y-1.5">
          <h1 className="text-h1 text-foreground">{current.title}</h1>
          <p className="text-body text-muted-foreground">{current.description}</p>
        </div>

        {step === 0 && (
          <form onSubmit={goToSlug} noValidate className="space-y-6">
            <AuthField
              id="name"
              label={m.name.label}
              type="text"
              required
              autoFocus
              value={name}
              onChange={handleNameChange}
              placeholder={m.name.placeholder}
              maxLength={60}
              error={fieldError}
              hint={m.name.hint}
            />
            <Button type="submit" size="lg" className="w-full">
              {m.next}
              <ArrowRight aria-hidden="true" />
            </Button>
          </form>
        )}

        {step === 1 && (
          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            {error && <FormAlert>{error}</FormAlert>}
            <dl className="flex items-center justify-between gap-4 rounded-md border border-border bg-surface-2 px-3 py-2.5 text-small">
              <dt className="text-faint">{m.summary.name}</dt>
              <dd className="truncate font-medium text-foreground">{name.trim()}</dd>
            </dl>
            <SlugField
              value={slug}
              onChange={(value) => {
                setSlug(value);
                if (fieldError) setFieldError(slugError(value));
              }}
              error={fieldError}
              disabled={loading}
            />
            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                size="lg"
                disabled={loading}
                onClick={() => {
                  setError("");
                  setFieldError(undefined);
                  setStep(0);
                }}
              >
                <ArrowLeft aria-hidden="true" />
                {m.back}
              </Button>
              <Button type="submit" size="lg" className="flex-1" disabled={loading || !slug.trim()}>
                {loading ? (
                  <>
                    <LoaderCircle className="animate-spin" aria-hidden="true" />
                    {m.pending}
                  </>
                ) : (
                  m.submit
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
