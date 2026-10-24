import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { requireRole } from "@/lib/auth";
import { formatRating } from "@/lib/catalog";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Panel del instructor" };

export default async function InstructorDashboardPage() {
  const profile = await requireRole("instructor", "/instructor");
  const supabase = await createClient();

  // Filtro explicito por dueno: RLS tambien expone los cursos publicados de otros
  const { data: courses } = await supabase
    .from("catalog_courses")
    .select("id, title, status, lessons_count, enrollments_count, rating_avg, reviews_count, updated_at")
    .eq("instructor_id", profile.id)
    .order("updated_at", { ascending: false });

  return (
    <div className="space-y-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mis cursos como instructor</h1>
        <Link
          href="/instructor/courses/new"
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Nuevo curso
        </Link>
      </div>

      {courses && courses.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-600">
              <tr>
                <th className="px-4 py-3 font-medium">Curso</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Lecciones</th>
                <th className="px-4 py-3 font-medium">Inscritos</th>
                <th className="px-4 py-3 font-medium">Calificación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {courses.map((course) => (
                <tr key={course.id}>
                  <td className="px-4 py-3">
                    <Link href={`/instructor/courses/${course.id}`} className="font-medium text-indigo-600 hover:underline">
                      {course.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={course.status} />
                  </td>
                  <td className="px-4 py-3">{course.lessons_count}</td>
                  <td className="px-4 py-3">{course.enrollments_count}</td>
                  <td className="px-4 py-3">{formatRating(course.rating_avg, course.reviews_count ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-neutral-300 p-10 text-center text-neutral-600">
          Todavía no tienes cursos. Crea el primero.
        </div>
      )}
    </div>
  );
}
