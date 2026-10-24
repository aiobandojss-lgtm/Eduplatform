import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { formatRating } from "@/lib/catalog";
import { createClient } from "@/lib/supabase/server";

// Solo cursos publicados: un borrador responde como inexistente (spec course-catalog)
const getPublishedCourse = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("catalog_courses")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  return data;
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const course = await getPublishedCourse((await params).slug);
  return course ? { title: course.title ?? undefined, description: course.short_description ?? undefined } : {};
}

const dateFormat = new Intl.DateTimeFormat("es-CO", { dateStyle: "long" });

export default async function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const course = await getPublishedCourse((await params).slug);
  if (!course?.id) notFound();

  const supabase = await createClient();
  // Solo titulos: el contenido vive en lesson_contents y RLS lo protege
  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, title, position")
    .eq("course_id", course.id)
    .order("position");

  return (
    <article className="grid gap-10 py-10 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <header className="space-y-2">
          <span className="text-sm font-semibold uppercase tracking-wide text-indigo-600">{course.category_name}</span>
          <h1 className="text-3xl font-bold">{course.title}</h1>
          <p className="text-lg text-neutral-700">{course.short_description}</p>
          <p className="text-sm text-neutral-500">
            <span className="text-amber-600">{formatRating(course.rating_avg, course.reviews_count ?? 0)}</span>
            {course.updated_at && <> · Última actualización: {dateFormat.format(new Date(course.updated_at))}</>}
          </p>
        </header>

        {course.description && (
          <section>
            <h2 className="mb-2 text-xl font-semibold">Descripción</h2>
            <p className="whitespace-pre-line text-neutral-700">{course.description}</p>
          </section>
        )}

        <section>
          <h2 className="mb-3 text-xl font-semibold">Temario</h2>
          <ol className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
            {/* Se numera por indice: borrar lecciones puede dejar huecos en position */}
            {lessons?.map((lesson, index) => (
              <li key={lesson.id} className="flex gap-3 px-4 py-3 text-sm">
                <span className="text-neutral-400">{index + 1}.</span>
                <span>{lesson.title}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <aside className="space-y-4">
        <div className="rounded-lg border border-neutral-200 bg-white p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Instructor</h2>
          <p className="mt-2 font-semibold">{course.instructor_name}</p>
          {course.instructor_bio && (
            <p className="mt-2 whitespace-pre-line text-sm text-neutral-600">{course.instructor_bio}</p>
          )}
        </div>
      </aside>
    </article>
  );
}
