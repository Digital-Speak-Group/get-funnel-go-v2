import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const reduced = vi.hoisted(() => ({ value: false as boolean | null }));
vi.mock("framer-motion", () => ({ useReducedMotion: () => reduced.value }));

import { motionPresets, useMotionPresets } from "@/lib/motion";

const hasMovement = (variant: object) =>
  ["x", "y", "scale"].some((key) => key in (variant as Record<string, unknown>));

describe("motion presets", () => {
  it("animate position and scale when motion is allowed", () => {
    const presets = motionPresets(false);
    expect(hasMovement(presets.rise.hidden)).toBe(true);
    expect(hasMovement(presets.slide.hidden)).toBe(true);
  });

  it("collapse to opacity-only under reduced motion", () => {
    const presets = motionPresets(true);
    for (const variants of [presets.rise, presets.fade, presets.slide]) {
      for (const state of Object.values(variants)) {
        expect(hasMovement(state)).toBe(false);
      }
    }
    expect(presets.stagger.visible).toEqual({});
  });

  it("hook follows the user's reduced-motion preference", () => {
    reduced.value = true;
    expect(hasMovement(renderHook(() => useMotionPresets()).result.current.rise.hidden)).toBe(false);
    reduced.value = null;
    expect(hasMovement(renderHook(() => useMotionPresets()).result.current.rise.hidden)).toBe(true);
  });
});
