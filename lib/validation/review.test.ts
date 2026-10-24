import { describe, expect, it } from "vitest";
import { reviewSchema } from "./review";

describe("reviewSchema", () => {
  it("acepta calificaciones de 1 a 5 y convierte el comentario vacio en null", () => {
    expect(reviewSchema.parse({ rating: "5", comment: "  " })).toEqual({ rating: 5, comment: null });
  });

  it("rechaza calificaciones fuera de rango o no enteras", () => {
    expect(reviewSchema.safeParse({ rating: "0", comment: "" }).success).toBe(false);
    expect(reviewSchema.safeParse({ rating: "6", comment: "" }).success).toBe(false);
    expect(reviewSchema.safeParse({ rating: "4.5", comment: "" }).success).toBe(false);
    expect(reviewSchema.safeParse({ rating: "", comment: "" }).success).toBe(false);
  });

  it("rechaza comentarios de mas de 2000 caracteres", () => {
    expect(reviewSchema.safeParse({ rating: "4", comment: "x".repeat(2001) }).success).toBe(false);
  });
});
