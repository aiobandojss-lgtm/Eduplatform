import { describe, expect, it } from "vitest";
import { slugCandidate, slugify } from "./slug";

describe("slugify", () => {
  it("normaliza tildes, mayusculas y simbolos", () => {
    expect(slugify("Automatización con IA: ¡Guía 2026!")).toBe("automatizacion-con-ia-guia-2026");
  });

  it("colapsa separadores y recorta guiones en los extremos", () => {
    expect(slugify("  --SEO   &   Ads--  ")).toBe("seo-ads");
  });

  it("produce un slug compatible con la restriccion de la base", () => {
    expect(slugify("Ñandú y café")).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    expect(slugify("x".repeat(300)).length).toBeLessThanOrEqual(150);
  });
});

describe("slugCandidate", () => {
  it("usa el slug base en el primer intento", () => {
    expect(slugCandidate("Prompts para Ads", 0)).toBe("prompts-para-ads");
  });

  it("agrega un sufijo numerico cuando hay colision", () => {
    expect(slugCandidate("Prompts para Ads", 1)).toBe("prompts-para-ads-2");
    expect(slugCandidate("Prompts para Ads", 2)).toBe("prompts-para-ads-3");
  });

  it("usa un base por defecto si el titulo no tiene caracteres validos", () => {
    expect(slugCandidate("¡¡¡", 0)).toBe("curso");
  });
});
