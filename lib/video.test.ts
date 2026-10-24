import { describe, expect, it } from "vitest";
import { isAllowedVideoUrl, toEmbedUrl } from "./video";

describe("isAllowedVideoUrl", () => {
  it("acepta YouTube y Vimeo", () => {
    expect(isAllowedVideoUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(true);
    expect(isAllowedVideoUrl("https://youtu.be/dQw4w9WgXcQ")).toBe(true);
    expect(isAllowedVideoUrl("https://vimeo.com/123456")).toBe(true);
  });

  it("rechaza otros proveedores, http y URLs disfrazadas", () => {
    expect(isAllowedVideoUrl("https://evil.com/video")).toBe(false);
    expect(isAllowedVideoUrl("http://www.youtube.com/watch?v=abc")).toBe(false);
    expect(isAllowedVideoUrl("https://youtube.com.evil.com/watch?v=abc")).toBe(false);
    expect(isAllowedVideoUrl("javascript:alert(1)")).toBe(false);
  });
});

describe("toEmbedUrl", () => {
  it("convierte URLs de YouTube al reproductor sin cookies", () => {
    expect(toEmbedUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
    );
    expect(toEmbedUrl("https://youtu.be/dQw4w9WgXcQ")).toBe("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ");
  });

  it("convierte URLs de Vimeo", () => {
    expect(toEmbedUrl("https://vimeo.com/123456")).toBe("https://player.vimeo.com/video/123456");
  });

  it("devuelve null para URLs no permitidas", () => {
    expect(toEmbedUrl("https://evil.com/x")).toBeNull();
  });
});
