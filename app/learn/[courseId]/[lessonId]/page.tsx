import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { requireProfile } from "@/lib/auth";
import { isUuid } from "@/lib/instructor";
import { createClient } from "@/lib/supabase/server";
import { toEmbedUrl } from "@/lib/video";

export const metadata = { title: "Lección" };

export default async function LessonViewerPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const { courseId, lessonId } = await params;
  if (!isUuid(courseId) || !isUuid(lessonId)) notFound();
  await requireProfile(`/learn/${courseId}/${lessonId}`);

  const supabase = await createClient();
  const [{ data: course }, { data: lessons }, { data: content }] = await Promise.all([
    supabase.from("courses").select("id, slug, title, status").eq("id", courseId).maybeSingle(),
    supabase.from("lessons").select("id, title").eq("course_id", courseId).order("position"),
    // RLS solo entrega el contenido a inscritos y al dueno
    supabase.from("lesson_contents").select("body_markdown, video_url").eq("lesson_id", lessonId).maybeSingle(),
  ]);

  if (!course) notFound();
  if (!content) {
    // Sin acceso al contenido: de vuelta a la ficha (spec course-enrollment)
    redirect(course.status === "published" ? `/courses/${course.slug}` : "/my-courses");
  }

  const index = lessons?.findIndex((l) => l.id === lessonId) ?? -1;
  if (!lessons || index === -1) notFound();
  const lesson = lessons[index];
  const previous = lessons[index - 1];
  const next = lessons[index + 1];
  const embedUrl = content.video_url ? toEmbedUrl(content.video_url) : null;

  return (
    <div className="grid gap-8 py-8 lg:grid-cols-4">
      <aside className="lg:col-span-1">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">{course.title}</h2>
        <ol className="space-y-1 text-sm">
          {lessons.map((l, i) => (
            <li key={l.id}>
              <Link
                href={`/learn/${courseId}/${l.id}`}
                aria-current={l.id === lessonId ? "page" : undefined}
                className={`block rounded-md px-3 py-2 ${
                  l.id === lessonId ? "bg-indigo-50 font-medium text-indigo-700" : "text-neutral-700 hover:bg-neutral-100"
                }`}
              >
                {i + 1}. {l.title}
              </Link>
            </li>
          ))}
        </ol>
      </aside>

      <article className="space-y-6 lg:col-span-3">
        <h1 className="text-2xl font-bold">{lesson.title}</h1>

        {embedUrl && (
          <div className="aspect-video overflow-hidden rounded-lg bg-black">
            <iframe
              src={embedUrl}
              title={lesson.title}
              className="h-full w-full"
              allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
            />
          </div>
        )}

        {/* react-markdown no renderiza HTML crudo: el contenido del instructor no puede inyectar scripts */}
        <div className="prose-lesson space-y-4 leading-relaxed text-neutral-800">
          <ReactMarkdown>{content.body_markdown}</ReactMarkdown>
        </div>

        <nav className="flex justify-between border-t border-neutral-200 pt-6 text-sm">
          {previous ? (
            <Link href={`/learn/${courseId}/${previous.id}`} className="text-indigo-600 hover:underline">
              ← Anterior: {previous.title}
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link href={`/learn/${courseId}/${next.id}`} className="font-semibold text-indigo-600 hover:underline">
              Siguiente: {next.title} →
            </Link>
          ) : (
            <Link href="/my-courses" className="text-indigo-600 hover:underline">
              Volver a mis cursos
            </Link>
          )}
        </nav>
      </article>
    </div>
  );
}
