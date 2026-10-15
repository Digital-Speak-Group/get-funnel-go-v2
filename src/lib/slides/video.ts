import type { VideoProvider } from "./free";

/**
 * YouTube / Vimeo links → provider + video id (Task 78), and back to player and thumbnail
 * addresses. Anything else is refused.
 */
export function parseVideoUrl(raw: string): { provider: VideoProvider; videoId: string } | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const host = url.hostname.toLowerCase().replace(/^www\.|^m\./, "");
  const id = (value: string | null | undefined) => (value && /^[A-Za-z0-9_-]{4,20}$/.test(value) ? value : null);

  if (host === "youtu.be") {
    const videoId = id(url.pathname.split("/")[1]);
    return videoId ? { provider: "youtube", videoId } : null;
  }
  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    const [, first, second] = url.pathname.split("/");
    const videoId = first === "watch" ? id(url.searchParams.get("v")) : ["embed", "shorts", "live"].includes(first) ? id(second) : null;
    return videoId ? { provider: "youtube", videoId } : null;
  }
  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const videoId = url.pathname.split("/").find((part) => /^\d{4,20}$/.test(part));
    return videoId ? { provider: "vimeo", videoId } : null;
  }
  return null;
}

/** Player address: privacy-enhanced YouTube, Vimeo without tracking. */
export function videoEmbedUrl(provider: VideoProvider, videoId: string): string {
  return provider === "youtube"
    ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}?rel=0`
    : `https://player.vimeo.com/video/${encodeURIComponent(videoId)}?dnt=1`;
}

/** Still image of the video, when the provider has a public one (YouTube). */
export function videoThumbnailUrl(provider: VideoProvider, videoId: string): string | null {
  return provider === "youtube" ? `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg` : null;
}
