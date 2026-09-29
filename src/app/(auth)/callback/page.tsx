import { Suspense } from "react";
import { CallbackContent } from "./CallbackContent";

export default function CallbackPage() {
  return (
    <Suspense fallback={<div className="text-center py-12"><div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" /><p className="text-zinc-400 mt-4">Chargement...</p></div>}>
      <CallbackContent />
    </Suspense>
  );
}