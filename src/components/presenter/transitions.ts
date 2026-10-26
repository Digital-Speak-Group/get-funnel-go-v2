import type { Transition, Variants } from "framer-motion";
import { SlideTransitionSchema, type SlideTransition } from "@/lib/slides/slide-style";

/** What the audience view needs to animate a slide change: the arriving slide's transition and the way we go. */
export interface TransitionCustom {
  kind: SlideTransition;
  /** 1 forward, -1 backward. */
  direction: 1 | -1;
  reduceMotion: boolean;
}

export const TRANSITION_DURATION = 0.45;
const EASE = [0.16, 1, 0.3, 1] as const;
const timing = (kind: SlideTransition): Transition => ({ duration: kind === "none" ? 0 : TRANSITION_DURATION, ease: EASE });

/** The slide's own transition (Task 74); slides without one cross-fade as before. */
export function slideTransitionOf(content: unknown): SlideTransition {
  const parsed = SlideTransitionSchema.safeParse((content as { transition?: unknown } | null)?.transition);
  return parsed.success ? parsed.data : "fade";
}

/**
 * Variants for AnimatePresence, resolved with the *arriving* slide's transition (passed as
 * `custom`, which also reaches the slide leaving), like slide transitions in PowerPoint.
 * Reduced motion keeps an opacity fade only.
 */
export const slideVariants: Variants = {
  enter: ({ kind, direction, reduceMotion }: TransitionCustom) => {
    if (kind === "none") return { opacity: 1, x: 0, scale: 1, transition: { duration: 0 } };
    if (reduceMotion || kind === "fade") return { opacity: 0, x: 0, scale: reduceMotion ? 1 : 0.985 };
    if (kind === "slide") return { opacity: 1, x: `${direction * 100}%`, scale: 1 };
    return { opacity: 0, x: 0, scale: 0.85 };
  },
  center: ({ kind }: TransitionCustom) => ({
    opacity: 1,
    x: 0,
    scale: 1,
    transition: timing(kind),
  }),
  exit: ({ kind, direction, reduceMotion }: TransitionCustom) => {
    const transition = timing(kind);
    if (kind === "none") return { opacity: 0, transition };
    if (reduceMotion || kind === "fade") return { opacity: 0, transition };
    if (kind === "slide") return { x: `${-direction * 100}%`, transition };
    return { opacity: 0, scale: 1.08, transition };
  },
};
