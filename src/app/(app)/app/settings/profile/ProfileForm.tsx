"use client";

import * as React from "react";
import { User, Mail, Globe, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { SectionCard } from "@/components/app/patterns/SectionCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { settingsMessages } from "../messages";
import { updateProfileAction } from "../actions";

interface ProfileFormProps {
  initialProfile: {
    fullName: string | null;
    email: string;
    locale: string;
  };
}

export function ProfileForm({ initialProfile }: ProfileFormProps) {
  const m = settingsMessages.profile;
  const [fullName, setFullName] = React.useState(initialProfile.fullName ?? "");
  const [locale, setLocale] = React.useState(initialProfile.locale || "fr");
  const [isPending, startTransition] = React.useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateProfileAction({
        fullName,
        locale: locale as "fr",
      });
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
        footer={
          <Button size="sm" type="submit" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                {settingsMessages.saving}
              </>
            ) : (
              settingsMessages.save
            )}
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="flex items-center gap-2">
              <User className="size-4 text-faint" />
              {m.fullName}
            </Label>
            <Input
              id="fullName"
              name="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={m.fullNamePlaceholder}
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="size-4 text-faint" />
              {m.email}
            </Label>
            <Input
              id="email"
              value={initialProfile.email}
              disabled
              className="bg-surface-2 text-muted-foreground"
            />
            <p className="text-xs text-faint">{m.emailNote}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="locale" className="flex items-center gap-2">
              <Globe className="size-4 text-faint" />
              {m.locale}
            </Label>
            <Select
              value={locale}
              onValueChange={setLocale}
              disabled={isPending}
            >
              <SelectTrigger id="locale">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fr">{m.locales.fr}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </SectionCard>
    </form>
  );
}
