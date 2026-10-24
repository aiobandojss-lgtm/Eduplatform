import Link from "next/link";
import { CourseCard } from "@/components/course-card";
import {
  catalogHref,
  pageRange,
  parseCatalogParams,
  totalPages,
} from "@/lib/catalog";
import { createClient } from "@/lib/supabase/server";

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = parseCatalogParams(await searchParams);
  const supabase = await createClient();
  const { from, to } = pageRange(params.page);

  const [{ data: categories }, { data: courses, count, error }] = await Promise.all([
    supabase.from("categories").select("slug, name").order("sort_order"),
    supabase
      .rpc(
        "search_catalog",
        { p_query: params.query || undefined, p_category_slug: params.category ?? undefined },
        { count: "exact" },
      )
      // Desempate por id para que la paginacion no repita ni omita cursos (design D10)
      .order("published_at", { ascending: false })
      .order("id", { ascending: false })
      .range(from, to),
  ]);

  if (error) throw new Error("No se pudo cargar el catálogo");

  const total = count ?? 0;
  const pages = totalPages(total);
  const hasFilters = Boolean(params.query || params.category);

  return (
    <div className="space-y-8 py-10">
      <div>
        <h1 className="text-3xl font-bold">Catálogo de cursos</h1>
        <p className="mt-1 text-neutral-600">Marketing digital e IA, de la mano de instructores seleccionados.</p>
      </div>

      {/* Formulario GET: la busqueda queda en la URL y se puede compartir */}
      <form action="/" className="flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          name="q"
          defaultValue={params.query}
          placeholder="Buscar cursos, por ejemplo: prompts"
          className="flex-1 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
        />
        <select
          name="category"
          defaultValue={params.category ?? ""}
          className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">Todas las categorías</option>
          {categories?.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
          Buscar
        </button>
      </form>

      {courses && courses.length > 0 ? (
        <>
          <p className="text-sm text-neutral-500">
            {total} {total === 1 ? "curso" : "cursos"}
          </p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
          {pages > 1 && (
            <nav className="flex items-center justify-center gap-4 text-sm" aria-label="Paginación">
              {params.page > 1 ? (
                <Link href={catalogHref({ ...params, page: params.page - 1 })} className="text-indigo-600 hover:underline">
                  ← Anterior
                </Link>
              ) : (
                <span className="text-neutral-400">← Anterior</span>
              )}
              <span>
                Página {params.page} de {pages}
              </span>
              {params.page < pages ? (
                <Link href={catalogHref({ ...params, page: params.page + 1 })} className="text-indigo-600 hover:underline">
                  Siguiente →
                </Link>
              ) : (
                <span className="text-neutral-400">Siguiente →</span>
              )}
            </nav>
          )}
        </>
      ) : hasFilters ? (
        <div className="rounded-lg border border-dashed border-neutral-300 p-10 text-center">
          <p className="font-medium">Sin resultados para tu búsqueda.</p>
          <Link href="/" className="mt-2 inline-block text-sm text-indigo-600 hover:underline">
            Limpiar búsqueda
          </Link>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-neutral-300 p-10 text-center text-neutral-600">
          Aún no hay cursos disponibles. ¡Vuelve pronto!
        </div>
      )}
    </div>
  );
}
