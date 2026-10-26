"use client";

import * as React from "react";
import Link from "next/link";
import { Building2, CreditCard, Link2, Loader2, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { SectionCard } from "@/components/app/patterns/SectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { settingsMessages } from "../messages";
import { updateOrganizationAction } from "../actions";

interface OrganizationFormProps {
  initialOrg: {
    name: string;
    slug: string;
    planName: string;
  };
  canEdit: boolean;
}

export function OrganizationForm({ initialOrg, canEdit }: OrganizationFormProps) {
  const m = settingsMessages.organization;
  const [name, setName] = React.useState(initialOrg.name);
  const [isPending, startTransition] = React.useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    startTransition(async () => {
      const res = await updateOrganizationAction({ name });
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success(m.success);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <SectionCard
        title={m.title}
        description={m.description}
        footerNote={!canEdit ? m.noPermission : undefined}
        footer={
          canEdit ? (
            <Button size="sm" type="submit" disabled={isPending || !name.trim()}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  {settingsMessages.saving}
                </>
              ) : (
                settingsMessages.save
              )}
            </Button>
          ) : undefined
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="orgName" className="flex items-center gap-2">
              <Building2 className="size-4 text-faint" />
              {m.name}
            </Label>
            <Input
              id="orgName"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={m.namePlaceholder}
              disabled={!canEdit || isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="orgSlug" className="flex items-center gap-2">
              <Link2 className="size-4 text-faint" />
              {m.slug}
            </Label>
            <Input
              id="orgSlug"
              value={initialOrg.slug}
              disabled
              className="font-mono bg-surface-2 text-muted-foreground"
            />
            <p className="text-xs text-faint">{m.slugNote}</p>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <CreditCard className="size-4 text-faint" />
              {m.plan}
            </Label>
            <div className="flex items-center justify-between rounded-md border border-border bg-surface-2 px-3 py-2 text-sm text-foreground">
              <span className="font-medium capitalize">{initialOrg.planName}</span>
              <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                <Link href="/app/settings/billing">
                  Gérer l'abonnement
                  <ArrowUpRight className="ml-1 size-3" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </SectionCard>
    </form>
  );
}
