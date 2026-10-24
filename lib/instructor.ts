import { notFound } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const uuid = z.uuid();

// Carga un curso solo si pertenece al instructor actual. RLS tambien deja ver
// cursos publicados de otros, por eso se filtra explicitamente por instructor_id.
export async function getOwnedCourse(courseId: string, nextPath: string) {
  if (!uuid.safeParse(courseId).success) notFound();
  const profile = await requireRole("instructor", nextPath);
  const supabase = await createClient();

  const { data: course } = await supabase
    .from("courses")
    .select("id, slug, title, short_description, description, category_id, status, published_at, updated_at")
    .eq("id", courseId)
    .eq("instructor_id", profile.id)
    .maybeSingle();

  if (!course) notFound();
  return { course, profile, supabase };
}

export function isUuid(value: string): boolean {
  return uuid.safeParse(value).success;
}
