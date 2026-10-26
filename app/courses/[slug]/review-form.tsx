"use client";

import { ActionButton } from "@/components/action-button";
import { FormMessage, SubmitButton, TextAreaField } from "@/components/form-fields";
import { useFormAction } from "@/lib/use-form-action";
import { deleteReview, saveReview } from "./actions";

type ExistingReview = { rating: number; comment: string | null };

export function ReviewForm({
  courseId,
  slug,
  existing,
}: {
  courseId: string;
  slug: string;
  existing: ExistingReview | null;
}) {
  const [state, action, pending] = useFormAction(saveReview, ["rating", "comment"]);
  const rating = state.values?.rating ?? (existing ? String(existing.rating) : undefined);

  return (
    <div className="space-y-3 rounded-lg border border-neutral-200 bg-white p-5">
      <h3 className="font-semibold">{existing ? "Tu reseña" : "Deja tu reseña"}</h3>
      <form action={action} className="space-y-3">
        <input type="hidden" name="courseId" value={courseId} />
        <input type="hidden" name="slug" value={slug} />
        <FormMessage error={state.error} success={state.success} />

        <fieldset className="space-y-1">
          <legend className="text-sm font-medium text-neutral-700">Calificación</legend>
          <div className="flex gap-3">
            {[1, 2, 3, 4, 5].map((value) => (
              <label key={value} className="flex items-center gap-1 text-sm">
                <input type="radio" name="rating" value={value} defaultChecked={rating === String(value)} required />
                {value} ★
              </label>
            ))}
          </div>
          {state.fieldErrors?.rating && <span className="text-sm text-red-600">{state.fieldErrors.rating}</span>}
        </fieldset>

        <TextAreaField
          label="Comentario (opcional)"
          name="comment"
          rows={3}
          maxLength={2000}
          defaultValue={state.values?.comment ?? existing?.comment ?? ""}
          error={state.fieldErrors?.comment}
        />
        <SubmitButton pending={pending}>{existing ? "Actualizar reseña" : "Publicar reseña"}</SubmitButton>
      </form>

      {existing && (
        <ActionButton
          action={deleteReview}
          fields={{ courseId, slug }}
          label="Eliminar mi reseña"
          variant="ghost"
          confirmMessage="¿Eliminar tu reseña?"
        />
      )}
    </div>
  );
}
