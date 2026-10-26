"use client";

import * as React from "react";
import { FileText, MoreHorizontal, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Toaster } from "@/components/ui/sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { EmptyState } from "@/components/app/patterns/EmptyState";
import { Kbd } from "@/components/app/patterns/Kbd";
import { Logo } from "@/components/app/patterns/Logo";
import { PageHeader } from "@/components/app/patterns/PageHeader";
import { SectionCard } from "@/components/app/patterns/SectionCard";
import { StatusPill } from "@/components/app/patterns/StatusPill";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 border-t border-border pt-8">
      <h2 className="text-label-caps text-faint">{title}</h2>
      {children}
    </section>
  );
}

export function UiShowcase() {
  return (
    <TooltipProvider delayDuration={300}>
      <main className="mx-auto max-w-5xl space-y-10 px-4 py-10 sm:px-8">
        <PageHeader
          eyebrow={<Logo />}
          title="Système de design"
          description="Primitives et patterns de la refonte — revue de la Phase 5."
          actions={
            <>
              <Button variant="secondary">Annuler</Button>
              <Button>
                <Plus /> Nouveau deck
              </Button>
            </>
          }
        />

        <Section title="Boutons">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Principal</Button>
            <Button variant="secondary">Secondaire</Button>
            <Button variant="outline">Contour</Button>
            <Button variant="ghost">Discret</Button>
            <Button variant="destructive">Supprimer</Button>
            <Button variant="link">Lien</Button>
            <Button disabled>Désactivé</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm">Petit</Button>
            <Button size="lg">Grand</Button>
            <Button size="xl">Très grand</Button>
            <Button size="icon" variant="secondary" aria-label="Modifier">
              <Pencil />
            </Button>
            <Button size="icon-sm" variant="ghost" aria-label="Plus d'options">
              <MoreHorizontal />
            </Button>
          </div>
        </Section>

        <Section title="Champs">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ui-title">Titre</Label>
              <Input id="ui-title" placeholder="Webinaire de lancement" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ui-invalid">Titre (invalide)</Label>
              <Input id="ui-invalid" aria-invalid defaultValue="Un titre bien trop long…" />
              <p className="text-small text-danger">80 caractères maximum.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ui-sort">Trier</Label>
              <Select defaultValue="recent">
                <SelectTrigger id="ui-sort">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Plus récents</SelectItem>
                  <SelectItem value="title">Titre (A–Z)</SelectItem>
                  <SelectItem value="oldest">Plus anciens</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ui-disabled">Désactivé</Label>
              <Input id="ui-disabled" disabled placeholder="Non modifiable" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="ui-script">Script</Label>
              <Textarea id="ui-script" placeholder="Collez votre script de vente…" rows={4} />
            </div>
            <div className="flex items-center gap-3">
              <Switch id="ui-switch" defaultChecked />
              <Label htmlFor="ui-switch">Synchroniser l&apos;audience</Label>
            </div>
          </div>
        </Section>

        <Section title="Badges, statuts, raccourcis">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>Brouillon</Badge>
            <Badge variant="brand">Pro</Badge>
            <Badge variant="success">Actif</Badge>
            <Badge variant="warning">Limite proche</Badge>
            <Badge variant="danger">Échec</Badge>
            <Badge variant="outline">Webinaire</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <StatusPill status="saved">Enregistré</StatusPill>
            <StatusPill status="saving">Enregistrement…</StatusPill>
            <StatusPill status="error">Échec de l&apos;enregistrement</StatusPill>
            <StatusPill status="live">Audience connectée</StatusPill>
            <span className="flex items-center gap-1 text-small text-muted-foreground">
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd>
            </span>
          </div>
        </Section>

        <Section title="Surfaces superposées">
          <Tabs defaultValue="script">
            <TabsList>
              <TabsTrigger value="script">Script</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="metrics">Métriques</TabsTrigger>
            </TabsList>
            <TabsContent value="script" className="text-sm text-muted-foreground">
              Contenu de l&apos;onglet Script.
            </TabsContent>
            <TabsContent value="notes" className="text-sm text-muted-foreground">
              Contenu de l&apos;onglet Notes.
            </TabsContent>
            <TabsContent value="metrics" className="text-sm text-muted-foreground">
              Contenu de l&apos;onglet Métriques.
            </TabsContent>
          </Tabs>
          <div className="flex flex-wrap gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="secondary">Ouvrir un dialogue</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nouveau deck</DialogTitle>
                  <DialogDescription>Donnez un titre et choisissez un thème.</DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                  <Label htmlFor="ui-dialog-title">Titre</Label>
                  <Input id="ui-dialog-title" placeholder="Webinaire Q4" />
                </div>
                <DialogFooter>
                  <Button variant="secondary">Annuler</Button>
                  <Button>Créer le deck</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="secondary">Ouvrir un panneau</Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>Inspecteur</SheetTitle>
                </SheetHeader>
                <div className="p-4 text-sm text-muted-foreground">Champs du slide.</div>
              </SheetContent>
            </Sheet>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="secondary">Popover</Button>
              </PopoverTrigger>
              <PopoverContent className="text-sm text-muted-foreground">Choix du thème.</PopoverContent>
            </Popover>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary">Menu</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem>
                  <Pencil /> Renommer
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <FileText /> Dupliquer
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-danger focus:text-danger [&_svg]:text-danger">
                  <Trash2 /> Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="secondary">Infobulle</Button>
              </TooltipTrigger>
              <TooltipContent>Raccourci : P</TooltipContent>
            </Tooltip>
            <Button variant="secondary" onClick={() => toast.success("Lien copié", { description: "Partagez-le avec votre audience." })}>
              Toast
            </Button>
          </div>
        </Section>

        <Section title="Cartes et sections">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Crédits</CardTitle>
                <CardDescription>Renouvelés le 1er du mois</CardDescription>
              </CardHeader>
              <CardContent className="font-mono text-h1 tabular-nums">64 / 100</CardContent>
              <CardFooter>
                <Button size="sm" variant="secondary">Gérer</Button>
              </CardFooter>
            </Card>
            <div className="space-y-3">
              <Skeleton className="aspect-video w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
          <SectionCard
            title="Organisation"
            description="Le nom apparaît sur vos decks partagés."
            footerNote="2 à 60 caractères."
            footer={<Button size="sm">Enregistrer</Button>}
          >
            <Input defaultValue="Digital Speak" aria-label="Nom de l'organisation" className="max-w-sm" />
          </SectionCard>
          <EmptyState
            icon={Sparkles}
            title="Votre tableau de bord est vide"
            description="Collez un script et laissez l'IA générer votre premier deck, ou partez d'un modèle éprouvé."
            actions={
              <>
                <Button>
                  <Sparkles /> Générer un deck
                </Button>
                <Button variant="secondary">Partir d&apos;un modèle</Button>
              </>
            }
          />
        </Section>
      </main>
      <Toaster />
    </TooltipProvider>
  );
}
