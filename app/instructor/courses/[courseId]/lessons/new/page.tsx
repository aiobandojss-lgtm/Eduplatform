import Link from "next/link";
import { getOwnedCourse } from "@/lib/instructor";
import { LessonForm } from "../lesson-form";

export const metadata = { title: "Nueva lección" };

export default async function NewLessonPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const { course } = await getOwnedCourse(courseId, `/instructor/courses/${courseId}/lessons/new`);

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-10">
      <Link href={`/instructor/courses/${course.id}`} className="text-sm text-indigo-600 hover:underline">
        ← Volver a {course.title}
      </Link>
      <h1 className="text-2xl font-bold">Nueva lección</h1>
      <LessonForm courseId={course.id} />
    </div>
  );
}
