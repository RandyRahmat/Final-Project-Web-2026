const MAX_INT4 = 2147483647;

export const ALLOWED_REACTION_TYPES = new Set([
  "love",
  "wow",
  "fire",
  "inspire",
  "applause",
]);

export function parsePositiveInt(value) {
  if (typeof value === "number") {
    return Number.isInteger(value) && value >= 1 && value <= MAX_INT4 ? value : null;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!/^\d+$/.test(trimmed)) return null;
    const parsed = Number(trimmed);
    return Number.isSafeInteger(parsed) && parsed >= 1 && parsed <= MAX_INT4 ? parsed : null;
  }
  return null;
}

export function safeDecodeURIComponent(value) {
  if (typeof value !== "string") return null;
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

export function isValidReactionType(type) {
  return typeof type === "string" && ALLOWED_REACTION_TYPES.has(type);
}

export function verifyImageMagicBytes(buffer, mimeType) {
  if (!buffer || buffer.length < 12) return false;

  switch (mimeType) {
    case "image/jpeg":
      return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    case "image/png":
      return (
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47 &&
        buffer[4] === 0x0d &&
        buffer[5] === 0x0a &&
        buffer[6] === 0x1a &&
        buffer[7] === 0x0a
      );
    case "image/gif":
      return (
        buffer[0] === 0x47 &&
        buffer[1] === 0x49 &&
        buffer[2] === 0x46 &&
        buffer[3] === 0x38 &&
        (buffer[4] === 0x37 || buffer[4] === 0x39) &&
        buffer[5] === 0x61
      );
    case "image/webp":
      return (
        buffer.toString("ascii", 0, 4) === "RIFF" &&
        buffer.toString("ascii", 8, 12) === "WEBP"
      );
    default:
      return false;
  }
}
