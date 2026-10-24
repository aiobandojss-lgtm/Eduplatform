import { describe, expect, it } from "vitest";
import { catalogHref, formatRating, pageRange, parseCatalogParams, totalPages } from "./catalog";

describe("parseCatalogParams", () => {
  it("usa valores por defecto sin parametros", () => {
    expect(parseCatalogParams({})).toEqual({ query: "", category: null, page: 1 });
  });

  it("recorta la busqueda y acepta slugs de categoria validos", () => {
    expect(parseCatalogParams({ q: "  prompts ", category: "paid-ads", page: "3" })).toEqual({
      query: "prompts",
      category: "paid-ads",
      page: 3,
    });
  });

  it("descarta paginas y categorias invalidas", () => {
    expect(parseCatalogParams({ page: "-2" }).page).toBe(1);
    expect(parseCatalogParams({ page: "abc" }).page).toBe(1);
    expect(parseCatalogParams({ category: "paid ads,evil" }).category).toBeNull();
  });
});

describe("paginacion", () => {
  it("calcula rangos inclusivos de 12", () => {
    expect(pageRange(1)).toEqual({ from: 0, to: 11 });
    expect(pageRange(2)).toEqual({ from: 12, to: 23 });
  });

  it("calcula el total de paginas con minimo 1", () => {
    expect(totalPages(0)).toBe(1);
    expect(totalPages(12)).toBe(1);
    expect(totalPages(13)).toBe(2);
  });
});

describe("catalogHref", () => {
  it("conserva filtros y omite la pagina 1", () => {
    expect(catalogHref({ query: "seo", category: "seo", page: 1 })).toBe("/?q=seo&category=seo");
    expect(catalogHref({ page: 2 })).toBe("/?page=2");
    expect(catalogHref({})).toBe("/");
  });
});

describe("formatRating", () => {
  it("muestra 'Sin reseñas' cuando no hay", () => {
    expect(formatRating(null, 0)).toBe("Sin reseñas");
  });

  it("muestra el promedio con un decimal y el conteo", () => {
    expect(formatRating(4.3, 3)).toBe("4.3 (3 reseñas)");
    expect(formatRating(5, 1)).toBe("5.0 (1 reseña)");
  });
});
