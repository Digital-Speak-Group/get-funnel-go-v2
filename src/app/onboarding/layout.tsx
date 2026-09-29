import Link from "next/link";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/" className="block text-center mb-8">
          <h1 className="text-3xl font-bold text-white">GetFunnels</h1>
        </Link>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 md:p-12">
          {children}
        </div>
      </div>
    </div>
  );
}