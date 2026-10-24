import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CourseForm } from "../course-form";

export const metadata = { title: "Nuevo curso" };

export default async function NewCoursePage() {
  await requireRole("instructor", "/instructor/courses/new");
  const supabase = await createClient();
  const { data: categories } = await supabase.from("categories").select("id, name").order("sort_order");

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-10">
      <Link href="/instructor" className="text-sm text-indigo-600 hover:underline">
        ← Volver al panel
      </Link>
      <h1 className="text-2xl font-bold">Nuevo curso</h1>
      <p className="text-sm text-neutral-600">El curso se crea como borrador. Podrás publicarlo cuando tenga al menos una lección.</p>
      <CourseForm categories={categories ?? []} />
    </div>
  );
}
