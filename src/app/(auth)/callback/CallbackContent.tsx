"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/app";
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    const type = searchParams.get("type");
    const msg = searchParams.get("message");
    const err = searchParams.get("error");

    if (err) {
      setError(err);
      setLoading(false);
      return;
    }

    if (msg) {
      setMessage(msg);
      setLoading(false);
      return;
    }

    if (code && type === "signup") {
      // Exchange code for session using PKCE flow
      fetch(`/api/auth/callback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, type: "signup" }),
      })
        .then((res) => res.json())
        .then((result) => {
          if (result.error) {
            setError(result.error);
          } else {
            setMessage("Email confirmé ! Redirection vers l'onboarding...");
            setTimeout(() => {
              router.push(`/onboarding?callbackUrl=${encodeURIComponent(callbackUrl)}`);
            }, 1500);
          }
        })
        .finally(() => {
          setLoading(false);
        });
    } else if (code && type === "recovery") {
      setMessage("Définissez votre nouveau mot de passe");
      setLoading(false);
    } else {
      setMessage("Lien invalide ou expiré");
      setLoading(false);
    }
  }, [router, searchParams, callbackUrl]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
        <p className="text-zinc-400 mt-4">Traitement en cours...</p>
      </div>
    );
  }

  return (
    <div className="text-center space-y-6">
      <div className={message ? "text-green-400" : "text-red-400"}>
        <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {message ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          )}
        </svg>
      </div>

      <div>
        <h2 className="text-xl font-medium text-white">
          {message ? "Succès" : "Erreur"}
        </h2>
        <p className="text-zinc-400 mt-1">{message || error || "Une erreur est survenue"}</p>
      </div>

      {!message && (
        <a
          href="/login"
          className="inline-block px-6 py-3 bg-violet-600 hover:bg-violet-500 rounded-lg font-medium text-white transition-colors"
        >
          Retour à la connexion
        </a>
      )}
    </div>
  );
}