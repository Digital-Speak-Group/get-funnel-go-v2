"use client";

import { useReducedMotion, type Transition, type Variants } from "framer-motion";

/** Mirrors --ease-out / --duration-* in globals.css (framer-motion cannot read CSS variables). */
export const EASE_OUT = [0.16, 1, 0.3, 1] as const;
export const DURATION = { fast: 0.15, base: 0.25, slow: 0.45 } as const;
export const STAGGER = 0.04;

export interface MotionPresets {
  /** Element entrance: fade + 6px rise. */
  rise: Variants;
  /** Plain fade. */
  fade: Variants;
  /** Parent that staggers its children's entrance. */
  stagger: Variants;
  /** Slide-to-slide transition for the audience view. */
  slide: Variants;
  transition: Transition;
}

export function motionPresets(reduced: boolean): MotionPresets {
  const transition: Transition = { duration: DURATION.base, ease: EASE_OUT };
  const fade: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition },
    exit: { opacity: 0, transition: { duration: DURATION.fast } },
  };

  if (reduced) {
    return {
      rise: fade,
      fade,
      stagger: { hidden: {}, visible: {} },
      slide: fade,
      transition,
    };
  }

  return {
    rise: {
      hidden: { opacity: 0, y: 6 },
      visible: { opacity: 1, y: 0, transition },
      exit: { opacity: 0, y: -4, transition: { duration: DURATION.fast } },
    },
    fade,
    stagger: { hidden: {}, visible: { transition: { staggerChildren: STAGGER } } },
    slide: {
      hidden: { opacity: 0, scale: 0.985 },
      visible: { opacity: 1, scale: 1, transition: { duration: DURATION.slow, ease: EASE_OUT } },
      exit: { opacity: 0, scale: 1.01, transition: { duration: DURATION.base, ease: EASE_OUT } },
    },
    transition,
  };
}

/** Motion presets that collapse to opacity-only under `prefers-reduced-motion`. */
export function useMotionPresets(): MotionPresets {
  return motionPresets(useReducedMotion() ?? false);
}
