"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signInAction } from "@/app/(auth)/actions";

export function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/app";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
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
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white">Connexion</h2>
        <p className="text-zinc-500 text-sm mt-1">
          Bienvenue de retour ! Connectez-vous à votre compte.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div
          className="flex items-start gap-3 px-4 py-3 rounded-xl text-sm"
          style={{
            background: "rgba(248,113,113,0.08)",
            border: "1px solid rgba(248,113,113,0.2)",
            color: "#fca5a5",
          }}
        >
          <span className="mt-0.5">⚠</span>
          <span>{error}</span>
        </div>
      )}

      {/* Fields */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="block text-xs font-medium text-zinc-400 uppercase tracking-widest"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@exemple.com"
            disabled={loading}
            className="w-full px-4 py-3 rounded-xl text-white text-sm placeholder-zinc-600 transition-all outline-none"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
            onFocus={(e) => {
              e.currentTarget.style.border = "1px solid rgba(139,92,246,0.5)";
              e.currentTarget.style.boxShadow =
                "0 0 0 3px rgba(139,92,246,0.1)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="block text-xs font-medium text-zinc-400 uppercase tracking-widest"
            >
              Mot de passe
            </label>
            <Link
              href="/forgot-password"
              className="text-xs text-zinc-500 hover:text-violet-400 transition-colors"
            >
              Oublié ?
            </Link>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            disabled={loading}
            className="w-full px-4 py-3 rounded-xl text-white text-sm placeholder-zinc-600 transition-all outline-none"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
            onFocus={(e) => {
              e.currentTarget.style.border = "1px solid rgba(139,92,246,0.5)";
              e.currentTarget.style.boxShadow =
                "0 0 0 3px rgba(139,92,246,0.1)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="relative w-full py-3 px-4 rounded-xl font-semibold text-sm text-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden group mt-2"
        style={{
          background: loading
            ? "rgba(71,12,133,0.6)"
            : "linear-gradient(135deg, #7c3aed 0%, #470c85 100%)",
          boxShadow: loading ? "none" : "0 0 24px rgba(124,58,237,0.35)",
        }}
      >
        {/* Shimmer hover effect */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
          }}
        />
        <span className="relative">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                />
              </svg>
              Connexion en cours…
            </span>
          ) : (
            "Se connecter →"
          )}
        </span>
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3 my-1">
        <div
          className="flex-1 h-px"
          style={{ background: "rgba(255,255,255,0.06)" }}
        />
        <span className="text-zinc-600 text-xs">ou</span>
        <div
          className="flex-1 h-px"
          style={{ background: "rgba(255,255,255,0.06)" }}
        />
      </div>

      {/* Sign up link */}
      <p className="text-center text-zinc-500 text-sm">
        Pas encore de compte ?{" "}
        <Link
          href={`/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
        >
          S'inscrire gratuitement
        </Link>
      </p>
    </form>
  );
}