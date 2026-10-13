"use client";

import * as React from "react";

/** True once the element comes within `rootMargin` of the viewport; stays true afterwards. */
export function useNearViewport<T extends Element>(rootMargin = "300px") {
  const ref = React.useRef<T>(null);
  const [near, setNear] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el || near) return;
    if (typeof IntersectionObserver === "undefined") {
      setNear(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [near, rootMargin]);

  return [ref, near] as const;
}

/** Live `prefers-reduced-motion: reduce`. */
export function usePrefersReducedMotion() {
  return React.useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia("(prefers-reduced-motion: reduce)");
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => true
  );
}
