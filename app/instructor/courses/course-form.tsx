"use client";

import { FormMessage, SubmitButton, TextAreaField, TextField } from "@/components/form-fields";
import { useFormAction } from "@/lib/use-form-action";
import { createCourse, updateCourse } from "../actions";

type Category = { id: number; name: string };
type CourseValues = {
  id: string;
  title: string;
  short_description: string;
  description: string;
  category_id: number;
};

export function CourseForm({ categories, course }: { categories: Category[]; course?: CourseValues }) {
  const [state, action, pending] = useFormAction(course ? updateCourse : createCourse, [
    "title",
    "shortDescription",
    "description",
    "categoryId",
  ]);
  const values = state.values;
  const errors = state.fieldErrors;

  return (
    <form action={action} className="space-y-4">
      {course && <input type="hidden" name="courseId" value={course.id} />}
      <FormMessage error={state.error} success={state.success} />
      <TextField label="Título" name="title" defaultValue={values?.title ?? course?.title} maxLength={150} required error={errors?.title} />
      <TextField
        label="Descripción corta (se muestra en el catálogo)"
        name="shortDescription"
        defaultValue={values?.shortDescription ?? course?.short_description}
        maxLength={300}
        required
        error={errors?.shortDescription}
      />
      <TextAreaField
        label="Descripción completa"
        name="description"
        rows={6}
        defaultValue={values?.description ?? course?.description}
        maxLength={10000}
        error={errors?.description}
      />
      <label className="block space-y-1">
        <span className="text-sm font-medium text-neutral-700">Categoría</span>
        <select
          name="categoryId"
          defaultValue={values?.categoryId ?? course?.category_id ?? ""}
          required
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
        >
          <option value="" disabled>
            Selecciona una categoría
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {errors?.categoryId && <span className="text-sm text-red-600">{errors.categoryId}</span>}
      </label>
      <SubmitButton pending={pending}>{course ? "Guardar cambios" : "Crear curso"}</SubmitButton>
    </form>
  );
}
