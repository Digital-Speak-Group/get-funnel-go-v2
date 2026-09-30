"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SystemTheme } from "@/lib/db/repositories/themes";
import type { SystemTemplate } from "@/lib/db/repositories/templates";
import { Loader2, Wand2, ArrowRight } from "lucide-react";

export function GenerationWizard({ themes, templates }: { themes: SystemTheme[], templates: SystemTemplate[] }) {
  const router = useRouter();
  
  const [script, setScript] = useState("");
  const [themeId, setThemeId] = useState(themes[0]?.id || "");
  const [templateId, setTemplateId] = useState(templates[0]?.id || "");
  const [slideCount, setSlideCount] = useState(20);
  const [tone, setTone] = useState("professional");

  const [status, setStatus] = useState<"idle" | "generating" | "done" | "error">("idle");
  const [progressStatus, setProgressStatus] = useState("");
  const [progressCurrent, setProgressCurrent] = useState(0);
  const [progressTotal, setProgressTotal] = useState(1);
  const [errorMsg, setErrorMsg] = useState("");

  const handleGenerate = async () => {
    if (script.length < 300) {
      setErrorMsg("Script must be at least 300 characters.");
      return;
    }
    
    setErrorMsg("");
    setStatus("generating");
    setProgressStatus("Démarrage...");

    const templateConfig = templates.find(t => t.id === templateId);
    
    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          script,
          themeId,
          templateConfig: {
            id: templateConfig?.slug, // the AI uses slug as ID generally, wait, in our API it expects `id` to be the string e.g. 'vsl'
            name: templateConfig?.name,
            stages: templateConfig?.config.stages
          },
          options: { slideCount, tone }
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to start generation");
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      
      let finalDeckId = "";

      while (true) {
        const { done, value } = (await reader?.read()) || { done: true, value: undefined };
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.substring(6);
            try {
              const data = JSON.parse(dataStr);
              if (data.status === "ERROR") {
                throw new Error(data.error || "Generation error");
              } else if (data.status === "GENERATING_SLIDES") {
                setProgressStatus(`Création des slides... (${data.progress}/${data.total})`);
                setProgressCurrent(data.progress || 0);
                setProgressTotal(data.total || 1);
              } else if (data.status === "DONE") {
                finalDeckId = data.deckId;
              } else {
                setProgressStatus(data.status); // e.g. EXTRACTING_BRIEF
              }
            } catch {
              console.error("Failed to parse SSE line", line);
            }
          }
        }
      }

      if (finalDeckId) {
        setStatus("done");
        router.push(`/app/decks/${finalDeckId}`);
      } else {
        throw new Error("No deck ID returned");
      }
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full p-8 space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
          <Wand2 className="h-5 w-5 text-violet-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Nouveau deck IA</h1>
          <p className="text-zinc-400 text-sm">Générez un deck complet à partir d'un script.</p>
        </div>
      </div>

      {status === "idle" || status === "error" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <label className="block text-sm font-medium text-zinc-300">Votre script</label>
            <textarea
              className="w-full h-[400px] bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              placeholder="Collez votre script de vente, page de vente, ou script de VSL ici... (min 300 caractères)"
              value={script}
              onChange={(e) => setScript(e.target.value)}
            />
            <div className="text-right text-xs text-zinc-500">
              {script.length} caractères
            </div>
            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {errorMsg}
              </div>
            )}
          </div>
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="block text-sm font-medium text-zinc-300">Modèle</label>
              <select
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
              >
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-medium text-zinc-300">Thème</label>
              <select
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                value={themeId}
                onChange={(e) => setThemeId(e.target.value)}
              >
                {themes.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-medium text-zinc-300">Nombre de slides ({slideCount})</label>
              <input
                type="range"
                min="5" max="40"
                className="w-full accent-violet-500"
                value={slideCount}
                onChange={(e) => setSlideCount(parseInt(e.target.value))}
              />
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-medium text-zinc-300">Ton</label>
              <select
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
              >
                <option value="professional">Professionnel</option>
                <option value="casual">Décontracté</option>
                <option value="urgent">Urgent</option>
                <option value="empathetic">Empathique</option>
                <option value="authoritative">Autoritaire</option>
              </select>
            </div>

            <button
              onClick={handleGenerate}
              className="w-full py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
            >
              Générer le deck <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-[400px] space-y-6">
          <div className="w-16 h-16 relative">
            <Loader2 className="w-16 h-16 text-violet-500 animate-spin" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-lg font-medium text-white">{progressStatus}</h2>
            {status === "generating" && progressStatus.includes("Création") && (
              <div className="w-64 h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-violet-500 transition-all duration-300" 
                  style={{ width: `${(progressCurrent / Math.max(progressTotal, 1)) * 100}%` }}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
