"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { dbErrorMessage } from "@/lib/db-errors";
import { fieldErrorsFrom, formValue, type FormState } from "@/lib/forms";
import { isUuid } from "@/lib/instructor";
import { createClient } from "@/lib/supabase/server";
import { reviewSchema } from "@/lib/validation/review";

function revalidateCoursePages(slug: string) {
  revalidatePath(`/courses/${slug}`);
  revalidatePath("/");
  revalidatePath("/instructor");
}

export async function enroll(_prev: FormState, formData: FormData): Promise<FormState> {
  const courseId = formValue(formData, "courseId");
  const slug = formValue(formData, "slug");
  if (!isUuid(courseId)) return { error: "Curso inválido." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/courses/${slug}`)}`);

  // RLS valida que el curso este publicado y no sea propio
  const { error } = await supabase.from("enrollments").insert({ user_id: user.id, course_id: courseId });

  // 23505: ya estaba inscrito; se trata como exito (idempotente)
  if (error && error.code !== "23505") {
    return { error: dbErrorMessage(error, "No se pudo completar la inscripción.") };
  }

  revalidatePath(`/courses/${slug}`);
  revalidatePath("/my-courses");

  // Directo a la primera leccion para no encadenar redirecciones tras el Server Action
  const { data: first } = await supabase
    .from("lessons")
    .select("id")
    .eq("course_id", courseId)
    .order("position")
    .limit(1)
    .maybeSingle();
  redirect(first ? `/learn/${courseId}/${first.id}` : "/my-courses");
}

export async function saveReview(_prev: FormState, formData: FormData): Promise<FormState> {
  const courseId = formValue(formData, "courseId");
  const slug = formValue(formData, "slug");
  if (!isUuid(courseId)) return { error: "Curso inválido." };

  const parsed = reviewSchema.safeParse({
    rating: formValue(formData, "rating"),
    comment: formValue(formData, "comment"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Inicia sesión de nuevo." };

  // Una resena por estudiante: si ya existe se edita en lugar de crear otra
  const { data: updated, error: updateError } = await supabase
    .from("reviews")
    .update({ rating: parsed.data.rating, comment: parsed.data.comment })
    .eq("course_id", courseId)
    .eq("user_id", user.id)
    .select("id");

  if (updateError) return { error: dbErrorMessage(updateError, "No se pudo guardar la reseña.") };

  if (!updated?.length) {
    const { error } = await supabase.from("reviews").insert({
      course_id: courseId,
      user_id: user.id,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
    });
    if (error) {
      const message =
        error.code === "42501" ? "Solo los estudiantes inscritos pueden reseñar este curso." : undefined;
      return { error: message ?? dbErrorMessage(error, "No se pudo guardar la reseña.") };
    }
  }

  revalidateCoursePages(slug);
  return { success: updated?.length ? "Reseña actualizada." : "¡Gracias por tu reseña!" };
}

export async function deleteReview(_prev: FormState, formData: FormData): Promise<FormState> {
  const courseId = formValue(formData, "courseId");
  const slug = formValue(formData, "slug");
  if (!isUuid(courseId)) return { error: "Curso inválido." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Inicia sesión de nuevo." };

  const { error } = await supabase.from("reviews").delete().eq("course_id", courseId).eq("user_id", user.id);
  if (error) return { error: dbErrorMessage(error, "No se pudo eliminar la reseña.") };

  revalidateCoursePages(slug);
  return { success: "Reseña eliminada." };
}
