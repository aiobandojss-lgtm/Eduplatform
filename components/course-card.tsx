import Link from "next/link";
import { formatRating } from "@/lib/catalog";

export type CourseCardData = {
  slug: string | null;
  title: string | null;
  short_description: string | null;
  category_name: string | null;
  instructor_name: string | null;
  rating_avg: number | null;
  reviews_count: number | null;
};

export function CourseCard({ course }: { course: CourseCardData }) {
  return (
    <Link
      href={`/courses/${course.slug}`}
      className="flex flex-col rounded-lg border border-neutral-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
    >
      <span className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
        {course.category_name}
      </span>
      <h2 className="mt-2 text-lg font-semibold text-neutral-900">{course.title}</h2>
      <p className="mt-1 line-clamp-3 flex-1 text-sm text-neutral-600">{course.short_description}</p>
      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-neutral-700">{course.instructor_name}</span>
        <span className="text-amber-600">
          {course.reviews_count ? "★ " : ""}
          {formatRating(course.rating_avg, course.reviews_count ?? 0)}
        </span>
      </div>
    </Link>
  );
}
