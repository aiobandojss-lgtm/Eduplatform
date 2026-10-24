"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { dbErrorMessage } from "@/lib/db-errors";
import { fieldErrorsFrom, formValue, type FormState } from "@/lib/forms";
import { isUuid } from "@/lib/instructor";
import { slugCandidate } from "@/lib/slug";
import { createClient } from "@/lib/supabase/server";
import { courseSchema, lessonSchema } from "@/lib/validation/course";

const MAX_SLUG_ATTEMPTS = 5;

function parseCourse(formData: FormData) {
  return courseSchema.safeParse({
    title: formValue(formData, "title"),
    shortDescription: formValue(formData, "shortDescription"),
    description: formValue(formData, "description"),
    categoryId: formValue(formData, "categoryId"),
  });
}

function revalidateCourse(courseId: string) {
  revalidatePath("/instructor");
  revalidatePath(`/instructor/courses/${courseId}`);
  revalidatePath("/");
  revalidatePath("/courses/[slug]", "page");
}

export async function createCourse(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseCourse(formData);
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Inicia sesión de nuevo." };

  // Reintenta con sufijo si el slug ya existe (puede ser un borrador ajeno que RLS oculta)
  for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
    const { data, error } = await supabase
      .from("courses")
      .insert({
        instructor_id: user.id,
        category_id: parsed.data.categoryId,
        slug: slugCandidate(parsed.data.title, attempt),
        title: parsed.data.title,
        short_description: parsed.data.shortDescription,
        description: parsed.data.description,
      })
      .select("id")
      .single();

    if (!error) {
      revalidatePath("/instructor");
      redirect(`/instructor/courses/${data.id}`);
    }
    if (error.code !== "23505") {
      return { error: dbErrorMessage(error, "No se pudo crear el curso.") };
    }
  }

  return { error: "No se pudo generar una dirección única para el curso. Cambia el título." };
}

export async function updateCourse(_prev: FormState, formData: FormData): Promise<FormState> {
  const courseId = formValue(formData, "courseId");
  if (!isUuid(courseId)) return { error: "Curso inválido." };

  const parsed = parseCourse(formData);
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const supabase = await createClient();
  // El slug no cambia al editar el titulo para no romper enlaces ya compartidos
  const { data, error } = await supabase
    .from("courses")
    .update({
      title: parsed.data.title,
      short_description: parsed.data.shortDescription,
      description: parsed.data.description,
      category_id: parsed.data.categoryId,
    })
    .eq("id", courseId)
    .select("id");

  if (error) return { error: dbErrorMessage(error, "No se pudo guardar el curso.") };
  // RLS filtra en silencio: 0 filas actualizadas significa que no eres el dueno
  if (!data?.length) return { error: dbErrorMessage({ code: "42501" }, "") };

  revalidateCourse(courseId);
  return { success: "Curso guardado." };
}

export async function setCourseStatus(_prev: FormState, formData: FormData): Promise<FormState> {
  const courseId = formValue(formData, "courseId");
  const status = formValue(formData, "status");
  if (!isUuid(courseId) || (status !== "draft" && status !== "published")) {
    return { error: "Solicitud inválida." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from("courses").update({ status }).eq("id", courseId).select("id");

  if (error) return { error: dbErrorMessage(error, "No se pudo cambiar el estado del curso.") };
  if (!data?.length) return { error: dbErrorMessage({ code: "42501" }, "") };

  revalidateCourse(courseId);
  return { success: status === "published" ? "Curso publicado." : "Curso despublicado." };
}

export async function deleteCourse(_prev: FormState, formData: FormData): Promise<FormState> {
  const courseId = formValue(formData, "courseId");
  if (!isUuid(courseId)) return { error: "Curso inválido." };

  const supabase = await createClient();
  const { data, error } = await supabase.from("courses").delete().eq("id", courseId).select("id");

  if (error) return { error: dbErrorMessage(error, "No se pudo eliminar el curso.") };
  if (!data?.length) return { error: dbErrorMessage({ code: "42501" }, "") };

  revalidatePath("/instructor");
  revalidatePath("/");
  redirect("/instructor");
}

function parseLesson(formData: FormData) {
  return lessonSchema.safeParse({
    title: formValue(formData, "title"),
    body: formValue(formData, "body"),
    videoUrl: formValue(formData, "videoUrl"),
  });
}

export async function createLesson(_prev: FormState, formData: FormData): Promise<FormState> {
  const courseId = formValue(formData, "courseId");
  if (!isUuid(courseId)) return { error: "Curso inválido." };

  const parsed = parseLesson(formData);
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const supabase = await createClient();
  // La posicion la asigna un trigger al final del temario
  const { data: lesson, error } = await supabase
    .from("lessons")
    .insert({ course_id: courseId, title: parsed.data.title })
    .select("id")
    .single();

  if (error) return { error: dbErrorMessage(error, "No se pudo crear la lección.") };

  const { error: contentError } = await supabase
    .from("lesson_contents")
    .insert({ lesson_id: lesson.id, body_markdown: parsed.data.body, video_url: parsed.data.videoUrl });

  if (contentError) {
    // Compensa para no dejar una leccion sin contenido
    await supabase.from("lessons").delete().eq("id", lesson.id);
    return { error: dbErrorMessage(contentError, "No se pudo guardar el contenido de la lección.") };
  }

  revalidateCourse(courseId);
  redirect(`/instructor/courses/${courseId}`);
}

export async function updateLesson(_prev: FormState, formData: FormData): Promise<FormState> {
  const courseId = formValue(formData, "courseId");
  const lessonId = formValue(formData, "lessonId");
  if (!isUuid(courseId) || !isUuid(lessonId)) return { error: "Lección inválida." };

  const parsed = parseLesson(formData);
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lessons")
    .update({ title: parsed.data.title })
    .eq("id", lessonId)
    .eq("course_id", courseId)
    .select("id");

  if (error) return { error: dbErrorMessage(error, "No se pudo guardar la lección.") };
  if (!data?.length) return { error: dbErrorMessage({ code: "42501" }, "") };

  const { error: contentError } = await supabase
    .from("lesson_contents")
    .upsert({ lesson_id: lessonId, body_markdown: parsed.data.body, video_url: parsed.data.videoUrl });

  if (contentError) return { error: dbErrorMessage(contentError, "No se pudo guardar el contenido.") };

  revalidateCourse(courseId);
  return { success: "Lección guardada." };
}

export async function deleteLesson(_prev: FormState, formData: FormData): Promise<FormState> {
  const courseId = formValue(formData, "courseId");
  const lessonId = formValue(formData, "lessonId");
  if (!isUuid(courseId) || !isUuid(lessonId)) return { error: "Lección inválida." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lessons")
    .delete()
    .eq("id", lessonId)
    .eq("course_id", courseId)
    .select("id");

  if (error) return { error: dbErrorMessage(error, "No se pudo eliminar la lección.") };
  if (!data?.length) return { error: dbErrorMessage({ code: "42501" }, "") };

  revalidateCourse(courseId);
  return { success: "Lección eliminada." };
}

export async function moveLesson(_prev: FormState, formData: FormData): Promise<FormState> {
  const courseId = formValue(formData, "courseId");
  const lessonId = formValue(formData, "lessonId");
  const direction = formValue(formData, "direction");
  if (!isUuid(courseId) || !isUuid(lessonId) || (direction !== "up" && direction !== "down")) {
    return { error: "Solicitud inválida." };
  }

  const supabase = await createClient();
  const { data: lessons, error } = await supabase
    .from("lessons")
    .select("id")
    .eq("course_id", courseId)
    .order("position");
  if (error || !lessons) return { error: "No se pudo leer el temario." };

  const ids = lessons.map((l) => l.id);
  const index = ids.indexOf(lessonId);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || target < 0 || target >= ids.length) return {};

  [ids[index], ids[target]] = [ids[target], ids[index]];

  const { error: reorderError } = await supabase.rpc("reorder_lessons", {
    p_course_id: courseId,
    p_lesson_ids: ids,
  });
  if (reorderError) return { error: dbErrorMessage(reorderError, "No se pudo reordenar.") };

  revalidateCourse(courseId);
  return {};
}
