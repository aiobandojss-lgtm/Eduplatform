// Genera slugs legibles para URLs: "Prompts para Ads ¡2026!" -> "prompts-para-ads-2026"
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita tildes
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 150)
    .replace(/-+$/g, "");
}

// Candidato de slug por intento: el primero es el base, luego base-2, base-3...
// Se usa reintentando cuando la base responde con violacion de unicidad (23505),
// porque RLS impide ver los borradores de otros instructores para chequear antes.
export function slugCandidate(title: string, attempt: number): string {
  const base = slugify(title) || "curso";
  return attempt === 0 ? base : `${base}-${attempt + 1}`;
}
