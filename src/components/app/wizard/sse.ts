/**
 * Splits a server-sent-events buffer into complete `data:` payloads. Network
 * chunks can end mid-event, so the trailing partial event is returned as `rest`
 * to be prepended to the next chunk.
 */
export function takeSseData(buffer: string): { data: string[]; rest: string } {
  const events = buffer.split("\n\n");
  const rest = events.pop() ?? "";
  const data = events
    .filter((event) => event.startsWith("data: "))
    .map((event) => event.slice("data: ".length));
  return { data, rest };
}
