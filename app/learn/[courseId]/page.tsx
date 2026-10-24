import { notFound, redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { isUuid } from "@/lib/instructor";
import { createClient } from "@/lib/supabase/server";

// Entrada al curso: redirige a la primera leccion del temario
export default async function LearnCoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  if (!isUuid(courseId)) notFound();
  await requireProfile(`/learn/${courseId}`);

  const supabase = await createClient();
  const { data: first } = await supabase
    .from("lessons")
    .select("id")
    .eq("course_id", courseId)
    .order("position")
    .limit(1)
    .maybeSingle();

  if (!first) notFound();
  redirect(`/learn/${courseId}/${first.id}`);
}
