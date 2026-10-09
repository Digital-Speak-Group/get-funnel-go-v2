import { notFound } from "next/navigation";
import { LayoutTemplate, Plus, Sparkles } from "lucide-react";
import { Shell } from "@/components/app/Shell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/app/patterns/EmptyState";
import { PageHeader } from "@/components/app/patterns/PageHeader";

export const metadata = { title: "Shell — GetFunnels (dev)", robots: { index: false } };

/** Dev-only preview of the app shell with mock workspace data (no auth or database). */
export default function DevShellPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <Shell
      userName="marie.dupont"
      userEmail="marie.dupont@example.com"
      workspace={{ orgName: "Digital Speak", planName: "Pro", decksCreated: 41, decksLimit: 50 }}
    >
      <div className="mx-auto max-w-6xl space-y-8">
        <PageHeader
          title="Decks"
          description="Vos présentations de vente"
          actions={
            <Button>
              <Plus /> Nouveau deck
            </Button>
          }
        />
        <EmptyState
          icon={Sparkles}
          title="Votre tableau de bord est vide"
          description="Collez un script et laissez l'IA générer votre premier deck, ou partez d'un modèle éprouvé."
          actions={
            <>
              <Button>
                <Sparkles /> Générer votre premier deck
              </Button>
              <Button variant="secondary">
                <LayoutTemplate /> Démarrer depuis un modèle
              </Button>
            </>
          }
        />
      </div>
    </Shell>
  );
}
