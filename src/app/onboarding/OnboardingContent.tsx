"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createOrgAction } from "@/app/onboarding/actions";

export function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/app";
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function generateSlug(input: string) {
    return input
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 50);
  }

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setName(value);
    if (!slug || slug === generateSlug(name)) {
      setSlug(generateSlug(value));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await createOrgAction({ name, slug });

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="text-center mb-4">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-8 h-8 bg-violet-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">1</span>
          </div>
          <div className="w-8 h-8 bg-zinc-700 rounded-full flex items-center justify-center">
            <span className="text-zinc-500 font-bold text-sm">2</span>
          </div>
          <div className="w-8 h-8 bg-zinc-700 rounded-full flex items-center justify-center">
            <span className="text-zinc-500 font-bold text-sm">3</span>
          </div>
        </div>
        <h2 className="text-2xl font-semibold text-white">Créer votre organisation</h2>
        <p className="text-zinc-400 mt-1">
          Configurez votre espace de travail pour commencer.
        </p>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-800 text-red-300 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-zinc-300 mb-1">
            Nom de l'organisation
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={name}
            onChange={handleNameChange}
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            placeholder="Ex: Mon Agence"
            disabled={loading}
            maxLength={60}
          />
          <p className="text-zinc-500 text-sm mt-1">2 à 60 caractères</p>
        </div>

        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-zinc-300 mb-1">
            Identifiant (slug)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">getfunnels.io/</span>
            <input
              id="slug"
              name="slug"
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase())}
              className="w-full pl-36 px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              placeholder="mon-agence"
              disabled={loading}
              maxLength={50}
              pattern="^[a-z0-9-]+$"
            />
          </div>
          <p className="text-zinc-500 text-sm mt-1">Lettres minuscules, chiffres et tirets uniquement</p>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !name.trim() || !slug.trim()}
        className="w-full py-3 px-4 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium text-white transition-colors"
      >
        {loading ? "Création..." : "Continuer"}
      </button>
    </form>
  );
}