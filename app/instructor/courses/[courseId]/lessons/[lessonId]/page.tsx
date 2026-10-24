import Link from "next/link";
import { notFound } from "next/navigation";
import { getOwnedCourse, isUuid } from "@/lib/instructor";
import { LessonForm } from "../lesson-form";

export const metadata = { title: "Editar lección" };

export default async function EditLessonPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const { courseId, lessonId } = await params;
  if (!isUuid(lessonId)) notFound();
  const { course, supabase } = await getOwnedCourse(courseId, `/instructor/courses/${courseId}/lessons/${lessonId}`);

  const { data: lesson } = await supabase
    .from("lessons")
    .select("id, title, lesson_contents(body_markdown, video_url)")
    .eq("id", lessonId)
    .eq("course_id", course.id)
    .maybeSingle();
  if (!lesson) notFound();

  // lesson_contents es 1:1 (PK = lesson_id), PostgREST lo devuelve como objeto
  const content = lesson.lesson_contents;

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-10">
      <Link href={`/instructor/courses/${course.id}`} className="text-sm text-indigo-600 hover:underline">
        ← Volver a {course.title}
      </Link>
      <h1 className="text-2xl font-bold">Editar lección</h1>
      <LessonForm
        courseId={course.id}
        lesson={{
          id: lesson.id,
          title: lesson.title,
          body: content?.body_markdown ?? "",
          videoUrl: content?.video_url ?? null,
        }}
      />
    </div>
  );
}
