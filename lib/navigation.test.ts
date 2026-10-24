import { describe, expect, it } from "vitest";
import { safeNextPath } from "./navigation";

describe("safeNextPath", () => {
  it("acepta rutas internas", () => {
    expect(safeNextPath("/courses/seo-basico")).toBe("/courses/seo-basico");
  });

  it("rechaza URLs externas y protocol-relative", () => {
    expect(safeNextPath("https://evil.com")).toBe("/");
    expect(safeNextPath("//evil.com")).toBe("/");
    expect(safeNextPath("/\\evil.com")).toBe("/");
  });

  it("usa el fallback con valores vacios o no string", () => {
    expect(safeNextPath(null)).toBe("/");
    expect(safeNextPath("", "/my-courses")).toBe("/my-courses");
  });
});
