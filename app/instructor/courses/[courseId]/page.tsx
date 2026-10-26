import Link from "next/link";
import { ActionButton } from "@/components/action-button";
import { StatusBadge } from "@/components/status-badge";
import { getOwnedCourse } from "@/lib/instructor";
import { deleteCourse, deleteLesson, moveLesson, setCourseStatus } from "../../actions";
import { CourseForm } from "../course-form";

export const metadata = { title: "Editar curso" };

export default async function EditCoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const { course, supabase } = await getOwnedCourse(courseId, `/instructor/courses/${courseId}`);

  const [{ data: categories }, { data: lessons }] = await Promise.all([
    supabase.from("categories").select("id, name").order("sort_order"),
    supabase.from("lessons").select("id, title, position").eq("course_id", course.id).order("position"),
  ]);

  const published = course.status === "published";

  return (
    <div className="space-y-10 py-10">
      <div className="space-y-2">
        <Link href="/instructor" className="text-sm text-indigo-600 hover:underline">
          ← Volver al panel
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">{course.title}</h1>
          <StatusBadge status={course.status} />
        </div>
        <div className="flex flex-wrap items-start gap-3">
          <ActionButton
            action={setCourseStatus}
            fields={{ courseId: course.id, status: published ? "draft" : "published" }}
            label={published ? "Despublicar" : "Publicar"}
            variant={published ? "secondary" : "primary"}
          />
          {published && (
            <Link href={`/courses/${course.slug}`} className="px-3 py-1.5 text-sm text-indigo-600 hover:underline">
              Ver ficha pública
            </Link>
          )}
          <ActionButton
            action={deleteCourse}
            fields={{ courseId: course.id }}
            label="Eliminar curso"
            variant="danger"
            confirmMessage="¿Eliminar este curso y todas sus lecciones? Esta acción no se puede deshacer."
          />
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Lecciones</h2>
          <Link
            href={`/instructor/courses/${course.id}/lessons/new`}
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Nueva lección
          </Link>
        </div>

        {lessons && lessons.length > 0 ? (
          <ol className="divide-y divide-neutral-200 rounded-lg border border-neutral-200 bg-white">
            {lessons.map((lesson, index) => (
              <li key={lesson.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                <span className="w-6 text-neutral-400">{index + 1}.</span>
                <Link
                  href={`/instructor/courses/${course.id}/lessons/${lesson.id}`}
                  className="flex-1 font-medium text-indigo-600 hover:underline"
                >
                  {lesson.title}
                </Link>
                <div className="flex items-start gap-1">
                  {index > 0 && (
                    <ActionButton
                      action={moveLesson}
                      fields={{ courseId: course.id, lessonId: lesson.id, direction: "up" }}
                      label="↑"
                      ariaLabel={`Subir ${lesson.title}`}
                      variant="ghost"
                      messageAlign="right"
                    />
                  )}
                  {index < lessons.length - 1 && (
                    <ActionButton
                      action={moveLesson}
                      fields={{ courseId: course.id, lessonId: lesson.id, direction: "down" }}
                      label="↓"
                      ariaLabel={`Bajar ${lesson.title}`}
                      variant="ghost"
                      messageAlign="right"
                    />
                  )}
                  <ActionButton
                    action={deleteLesson}
                    fields={{ courseId: course.id, lessonId: lesson.id }}
                    label="Eliminar"
                    variant="ghost"
                      messageAlign="right"
                    confirmMessage={`¿Eliminar la lección "${lesson.title}"?`}
                  />
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="rounded-lg border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-600">
            Este curso aún no tiene lecciones. Necesitas al menos una para publicarlo.
          </p>
        )}
      </section>

      <section className="max-w-2xl space-y-4">
        <h2 className="text-xl font-semibold">Datos del curso</h2>
        <CourseForm categories={categories ?? []} course={course} />
      </section>
    </div>
  );
}
