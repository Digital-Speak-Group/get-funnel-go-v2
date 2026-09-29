import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex overflow-hidden bg-[#070711]"
      style={{ minHeight: "100dvh" }}
    >
      {/* ── Left panel: branding ── */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col overflow-hidden">
        {/* Ambient glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 100% 80% at 10% 100%, rgba(71,12,133,0.7) 0%, transparent 55%), radial-gradient(ellipse 80% 60% at 85% 5%, rgba(139,92,246,0.35) 0%, transparent 55%)",
          }}
        />
        {/* Grid */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* Inner layout: fill full height, space content */}
        <div className="relative z-10 flex flex-col h-full p-12">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 w-fit shrink-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0"
              style={{
                background:
                  "linear-gradient(135deg, #7c3aed 0%, #470c85 100%)",
                boxShadow: "0 0 24px rgba(139,92,246,0.45)",
              }}
            >
              G
            </div>
            <span className="text-white font-semibold text-xl tracking-tight">
              GetFunnels
            </span>
          </Link>

          {/* Center content */}
          <div className="flex-1 flex flex-col justify-center">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-6 w-fit"
              style={{
                background: "rgba(139,92,246,0.15)",
                border: "1px solid rgba(139,92,246,0.3)",
                color: "#c4b5fd",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              Propulsé par l&apos;IA · 7 frameworks éprouvés
            </div>

            <blockquote className="text-white/90 text-2xl font-medium leading-snug mb-4 max-w-sm">
              &ldquo;Transformez votre script de vente en un deck prêt à
              présenter, en quelques secondes.&rdquo;
            </blockquote>

            <p className="text-white/40 text-sm max-w-xs">
              Choisissez un template, collez votre script — l&apos;IA fait le
              reste.
            </p>
          </div>

          {/* Stats — inside padding at the bottom, never bleeds */}
          <div
            className="grid grid-cols-3 gap-6 pt-6 shrink-0"
            style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
          >
            {[
              { value: "7", label: "Frameworks" },
              { value: "∞", label: "Decks générés" },
              { value: "2 min", label: "Temps moyen" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-white text-2xl font-bold">{stat.value}</p>
                <p className="text-white/40 text-xs mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right panel: form ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative">
        {/* Subtle glow behind card */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(71,12,133,0.1) 0%, transparent 70%)",
          }}
        />

        {/* Mobile logo */}
        <Link
          href="/"
          className="lg:hidden flex items-center gap-2 mb-10 relative z-10"
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
            style={{
              background: "linear-gradient(135deg, #7c3aed 0%, #470c85 100%)",
            }}
          >
            G
          </div>
          <span className="text-white font-semibold text-lg">GetFunnels</span>
        </Link>

        {/* Form card */}
        <div
          className="relative z-10 w-full max-w-[420px] rounded-2xl p-8"
          style={{
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow:
              "inset 0 0 0 1px rgba(139,92,246,0.05), 0 32px 80px rgba(0,0,0,0.65), 0 0 60px rgba(71,12,133,0.15)",
            backdropFilter: "blur(24px)",
          }}
        >
          {children}
        </div>

        {/* Legal footer */}
        <p className="relative z-10 text-center text-zinc-600 text-xs mt-8 max-w-xs leading-relaxed">
          En continuant, vous acceptez nos{" "}
          <a
            href="/legal/terms"
            className="text-zinc-500 hover:text-violet-400 transition-colors"
          >
            Conditions d&apos;utilisation
          </a>{" "}
          et notre{" "}
          <a
            href="/legal/privacy"
            className="text-zinc-500 hover:text-violet-400 transition-colors"
          >
            Politique de confidentialité
          </a>
        </p>
      </div>
    </div>
  );
}