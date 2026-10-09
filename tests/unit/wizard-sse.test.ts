import { describe, it, expect } from "vitest";
import { takeSseData } from "@/components/app/wizard/sse";

describe("takeSseData", () => {
  it("returns complete events and keeps nothing when the buffer ends on a boundary", () => {
    expect(takeSseData('data: {"a":1}\n\ndata: {"b":2}\n\n')).toEqual({
      data: ['{"a":1}', '{"b":2}'],
      rest: "",
    });
  });

  it("holds back a partial event until the next chunk completes it", () => {
    const first = takeSseData('data: {"status":"EXTRACTING_BRIEF"}\n\ndata: {"status":"DO');
    expect(first.data).toEqual(['{"status":"EXTRACTING_BRIEF"}']);

    const second = takeSseData(first.rest + 'NE","deckId":"d1"}\n\n');
    expect(second).toEqual({ data: ['{"status":"DONE","deckId":"d1"}'], rest: "" });
  });

  it("ignores non-data lines", () => {
    expect(takeSseData(": keepalive\n\ndata: x\n\n").data).toEqual(["x"]);
  });
});
