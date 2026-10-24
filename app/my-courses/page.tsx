import Link from "next/link";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Mis cursos" };

const dateFormat = new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" });

export default async function MyCoursesPage() {
  const profile = await requireProfile("/my-courses");
  const supabase = await createClient();

  // Incluye cursos despublicados: el inscrito conserva el acceso (RLS)
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("created_at, course:courses(id, title, short_description)")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6 py-10">
      <h1 className="text-2xl font-bold">Mis cursos</h1>

      {enrollments && enrollments.length > 0 ? (
        <ul className="grid gap-4 sm:grid-cols-2">
          {enrollments.map(
            ({ created_at, course }) =>
              course && (
                <li key={course.id} className="rounded-lg border border-neutral-200 bg-white p-5">
                  <h2 className="font-semibold">{course.title}</h2>
                  <p className="mt-1 line-clamp-2 text-sm text-neutral-600">{course.short_description}</p>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-neutral-500">Inscrito el {dateFormat.format(new Date(created_at))}</span>
                    <Link href={`/learn/${course.id}`} className="font-semibold text-indigo-600 hover:underline">
                      Ir al curso →
                    </Link>
                  </div>
                </li>
              ),
          )}
        </ul>
      ) : (
        <div className="rounded-lg border border-dashed border-neutral-300 p-10 text-center text-neutral-600">
          Aún no estás inscrito en ningún curso.{" "}
          <Link href="/" className="font-medium text-indigo-600 hover:underline">
            Explora el catálogo
          </Link>
        </div>
      )}
    </div>
  );
}
