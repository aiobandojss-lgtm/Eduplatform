// Misma regla que el CHECK de lesson_contents.video_url (solo YouTube o Vimeo)
const ALLOWED_VIDEO = /^https:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|vimeo\.com\/)[A-Za-z0-9_-]+/;

export function isAllowedVideoUrl(url: string): boolean {
  return ALLOWED_VIDEO.test(url);
}

// Convierte la URL publica en la URL del reproductor embebido
export function toEmbedUrl(url: string): string | null {
  if (!isAllowedVideoUrl(url)) return null;
  const parsed = new URL(url);

  if (parsed.hostname.endsWith("youtube.com")) {
    const id = parsed.searchParams.get("v");
    return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
  }
  if (parsed.hostname === "youtu.be") {
    return `https://www.youtube-nocookie.com/embed/${parsed.pathname.slice(1)}`;
  }
  const vimeoId = parsed.pathname.split("/").filter(Boolean)[0];
  return vimeoId ? `https://player.vimeo.com/video/${vimeoId}` : null;
}
