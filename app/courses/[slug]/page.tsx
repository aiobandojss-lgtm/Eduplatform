import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getCurrentProfile } from "@/lib/auth";
import { formatRating } from "@/lib/catalog";
import { createClient } from "@/lib/supabase/server";
import { EnrollButton } from "./enroll-button";
import { ReviewForm } from "./review-form";

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
  const { slug } = await params;
  const course = await getPublishedCourse(slug);
  if (!course?.id) notFound();

  const supabase = await createClient();
  const profile = await getCurrentProfile();
  const isOwner = profile?.id === course.instructor_id;

  const [{ data: lessons }, { data: reviews }, enrollment] = await Promise.all([
    // Solo titulos: el contenido vive en lesson_contents y RLS lo protege
    supabase.from("lessons").select("id, title").eq("course_id", course.id).order("position"),
    supabase
      .from("reviews")
      .select("id, user_id, rating, comment, created_at, author:profiles(display_name)")
      .eq("course_id", course.id)
      .order("created_at", { ascending: false }),
    profile && !isOwner
      ? supabase
          .from("enrollments")
          .select("id")
          .eq("course_id", course.id)
          .eq("user_id", profile.id)
          .maybeSingle()
          .then((r) => r.data)
      : Promise.resolve(null),
  ]);

  const isEnrolled = Boolean(enrollment);
  const myReview = profile ? reviews?.find((r) => r.user_id === profile.id) ?? null : null;

  return (
    <article className="grid gap-10 py-10 lg:grid-cols-3">
      <div className="space-y-8 lg:col-span-2">
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

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Reseñas</h2>
          {isEnrolled && <ReviewForm courseId={course.id} slug={slug} existing={myReview} />}
          {reviews && reviews.length > 0 ? (
            <ul className="space-y-3">
              {reviews.map((review) => (
                <li key={review.id} className="rounded-lg border border-neutral-200 bg-white p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{review.author?.display_name ?? "Estudiante"}</span>
                    <span className="text-neutral-500">{dateFormat.format(new Date(review.created_at))}</span>
                  </div>
                  <p className="mt-1 text-amber-600" aria-label={`${review.rating} de 5 estrellas`}>
                    {"★".repeat(review.rating)}
                    <span className="text-neutral-300">{"★".repeat(5 - review.rating)}</span>
                  </p>
                  {review.comment && <p className="mt-2 whitespace-pre-line text-sm text-neutral-700">{review.comment}</p>}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-neutral-600">Sin reseñas todavía.</p>
          )}
        </section>
      </div>

      <aside className="space-y-4">
        <div className="space-y-3 rounded-lg border border-neutral-200 bg-white p-5">
          {isOwner ? (
            <Link href={`/instructor/courses/${course.id}`} className="block text-center text-sm font-semibold text-indigo-600 hover:underline">
              Eres el instructor · Editar curso
            </Link>
          ) : isEnrolled ? (
            <Link
              href={`/learn/${course.id}`}
              className="block rounded-md bg-indigo-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Ir al curso
            </Link>
          ) : profile ? (
            <EnrollButton courseId={course.id} slug={slug} />
          ) : (
            <Link
              href={`/login?next=${encodeURIComponent(`/courses/${slug}`)}`}
              className="block rounded-md bg-indigo-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-indigo-700"
            >
              Inscribirme gratis
            </Link>
          )}
          <p className="text-center text-xs text-neutral-500">{lessons?.length ?? 0} lecciones · Acceso gratuito</p>
        </div>

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
