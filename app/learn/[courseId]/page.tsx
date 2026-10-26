import { notFound, redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { isUuid } from "@/lib/instructor";
import { createClient } from "@/lib/supabase/server";

// Entrada al curso: verifica el acceso aqui mismo para hacer una sola redireccion
// (a la primera leccion o a la ficha), sin encadenar redirecciones
export default async function LearnCoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  if (!isUuid(courseId)) notFound();
  await requireProfile(`/learn/${courseId}`);

  const supabase = await createClient();
  const [{ data: course }, { data: first }] = await Promise.all([
    supabase.from("courses").select("slug, status").eq("id", courseId).maybeSingle(),
    supabase
      .from("lessons")
      .select("id, lesson_contents(lesson_id)")
      .eq("course_id", courseId)
      .order("position")
      .limit(1)
      .maybeSingle(),
  ]);

  if (!course || !first) notFound();

  // RLS solo devuelve lesson_contents a inscritos y al dueno
  if (!first.lesson_contents) {
    redirect(course.status === "published" ? `/courses/${course.slug}` : "/my-courses");
  }

  redirect(`/learn/${courseId}/${first.id}`);
}
