/**
 * Uploads are capped here, under the 4.5 MB request-body limit of serverless hosts;
 * architecture.md asks for images pre-resized to ≤ 2000 px.
 */
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

export interface ImageInfo {
  mimeType: "image/png" | "image/jpeg" | "image/webp" | "image/gif";
  ext: "png" | "jpg" | "webp" | "gif";
  width?: number;
  height?: number;
}

const startsWith = (bytes: Uint8Array, signature: number[], offset = 0) =>
  signature.every((b, i) => bytes[offset + i] === b);

/**
 * Identifies an image from its bytes, never from a client-supplied name or MIME type.
 * Only raster formats are accepted: SVG can carry scripts, so it is rejected (returns null).
 */
export function sniffImage(bytes: Uint8Array): ImageInfo | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    const ok = bytes.length >= 24;
    return {
      mimeType: "image/png",
      ext: "png",
      width: ok ? view.getUint32(16) : undefined,
      height: ok ? view.getUint32(20) : undefined,
    };
  }
  if (startsWith(bytes, [0x47, 0x49, 0x46, 0x38])) {
    const ok = bytes.length >= 10;
    return {
      mimeType: "image/gif",
      ext: "gif",
      width: ok ? view.getUint16(6, true) : undefined,
      height: ok ? view.getUint16(8, true) : undefined,
    };
  }
  if (startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)) {
    return { mimeType: "image/webp", ext: "webp", ...webpSize(bytes, view) };
  }
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) {
    return { mimeType: "image/jpeg", ext: "jpg", ...jpegSize(bytes, view) };
  }
  return null;
}

function webpSize(bytes: Uint8Array, view: DataView): { width?: number; height?: number } {
  if (bytes.length < 30) return {};
  const chunk = String.fromCharCode(bytes[12], bytes[13], bytes[14], bytes[15]);
  if (chunk === "VP8X") {
    const read24 = (o: number) => bytes[o] | (bytes[o + 1] << 8) | (bytes[o + 2] << 16);
    return { width: read24(24) + 1, height: read24(27) + 1 };
  }
  if (chunk === "VP8L") {
    const bits = view.getUint32(21, true);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  if (chunk === "VP8 ") {
    return { width: view.getUint16(26, true) & 0x3fff, height: view.getUint16(28, true) & 0x3fff };
  }
  return {};
}

function jpegSize(bytes: Uint8Array, view: DataView): { width?: number; height?: number } {
  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) return {};
    const marker = bytes[offset + 1];
    const length = view.getUint16(offset + 2);
    // SOF0–SOF15 carry the frame size, except DHT (C4), JPG (C8) and DAC (CC).
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { height: view.getUint16(offset + 5), width: view.getUint16(offset + 7) };
    }
    offset += 2 + length;
  }
  return {};
}
