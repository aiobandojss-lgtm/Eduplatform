import { describe, expect, it } from "vitest";
import { courseSchema, lessonSchema } from "./course";

describe("courseSchema", () => {
  const valid = { title: "SEO para principiantes", shortDescription: "Lo basico", description: "", categoryId: "1" };

  it("acepta un curso valido y convierte la categoria a numero", () => {
    expect(courseSchema.parse(valid).categoryId).toBe(1);
  });

  it("exige titulo y categoria", () => {
    expect(courseSchema.safeParse({ ...valid, title: "  " }).success).toBe(false);
    expect(courseSchema.safeParse({ ...valid, categoryId: "" }).success).toBe(false);
  });
});

describe("lessonSchema", () => {
  const valid = { title: "Introduccion", body: "# Hola", videoUrl: "" };

  it("convierte un video vacio en null", () => {
    expect(lessonSchema.parse(valid).videoUrl).toBeNull();
  });

  it("acepta YouTube y rechaza otros proveedores", () => {
    expect(lessonSchema.safeParse({ ...valid, videoUrl: "https://youtu.be/abc123" }).success).toBe(true);
    expect(lessonSchema.safeParse({ ...valid, videoUrl: "https://evil.com/v" }).success).toBe(false);
  });
});
