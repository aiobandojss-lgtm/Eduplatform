"use client";

import { useActionState } from "react";
import { FormMessage, SubmitButton, TextAreaField, TextField } from "@/components/form-fields";
import type { FormState } from "@/lib/forms";
import { createLesson, updateLesson } from "../../../actions";

type LessonValues = { id: string; title: string; body: string; videoUrl: string | null };

export function LessonForm({ courseId, lesson }: { courseId: string; lesson?: LessonValues }) {
  const [state, action, pending] = useActionState<FormState, FormData>(lesson ? updateLesson : createLesson, {});
  const errors = state.fieldErrors;

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="courseId" value={courseId} />
      {lesson && <input type="hidden" name="lessonId" value={lesson.id} />}
      <FormMessage error={state.error} success={state.success} />
      <TextField label="Título" name="title" defaultValue={lesson?.title} maxLength={150} required error={errors?.title} />
      <TextField
        label="URL del video (opcional, YouTube o Vimeo)"
        name="videoUrl"
        type="url"
        defaultValue={lesson?.videoUrl ?? ""}
        placeholder="https://www.youtube.com/watch?v=..."
        error={errors?.videoUrl}
      />
      <TextAreaField
        label="Contenido (Markdown)"
        name="body"
        rows={16}
        defaultValue={lesson?.body}
        maxLength={50000}
        className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 font-mono text-sm"
        error={errors?.body}
      />
      <SubmitButton pending={pending}>{lesson ? "Guardar lección" : "Crear lección"}</SubmitButton>
    </form>
  );
}
