import type { ShapeName } from "@/lib/slides/free";

/** Star with 5 points in a 100×100 box. */
function star(): string {
  const points: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 50 : 21;
    const a = (Math.PI / 5) * i - Math.PI / 2;
    points.push(`${(50 + r * Math.cos(a)).toFixed(2)},${(52 + r * Math.sin(a)).toFixed(2)}`);
  }
  return `M${points.join(" L")} Z`;
}

/**
 * Outlines of the SVG shapes (Task 77) in a 100×100 view box, stretched to the element's box.
 * Box shapes (rect, ellipse, line) are drawn with CSS instead.
 */
export const SHAPE_PATHS: Partial<Record<ShapeName, string>> = {
  triangle: "M50,0 L100,100 L0,100 Z",
  diamond: "M50,0 L100,50 L50,100 L0,50 Z",
  arrow: "M0,32 L62,32 L62,4 L100,50 L62,96 L62,68 L0,68 Z",
  star: star(),
  bubble: "M8,0 H92 Q100,0 100,8 V64 Q100,72 92,72 H42 L22,98 L26,72 H8 Q0,72 0,64 V8 Q0,0 8,0 Z",
};
