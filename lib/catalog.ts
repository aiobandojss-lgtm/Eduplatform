export const CATALOG_PAGE_SIZE = 12;

export type CatalogParams = {
  query: string;
  category: string | null;
  page: number;
};

type RawParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export function parseCatalogParams(raw: RawParams): CatalogParams {
  const query = first(raw.q).trim().slice(0, 100);
  const category = first(raw.category).trim();
  const page = Number.parseInt(first(raw.page), 10);

  return {
    query,
    category: /^[a-z0-9-]+$/.test(category) ? category : null,
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

// Rango inclusivo para .range() de Supabase
export function pageRange(page: number, pageSize = CATALOG_PAGE_SIZE): { from: number; to: number } {
  const from = (page - 1) * pageSize;
  return { from, to: from + pageSize - 1 };
}

export function totalPages(total: number, pageSize = CATALOG_PAGE_SIZE): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

// Construye la URL del catalogo conservando filtros; omite valores por defecto
export function catalogHref(params: Partial<CatalogParams>): string {
  const search = new URLSearchParams();
  if (params.query) search.set("q", params.query);
  if (params.category) search.set("category", params.category);
  if (params.page && params.page > 1) search.set("page", String(params.page));
  const qs = search.toString();
  return qs ? `/?${qs}` : "/";
}

export function formatRating(average: number | null, count: number): string {
  if (count === 0 || average === null) return "Sin reseñas";
  const label = count === 1 ? "reseña" : "reseñas";
  return `${average.toFixed(1)} (${count} ${label})`;
}
