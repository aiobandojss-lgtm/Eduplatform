"use client";

import { useActionState } from "react";
import { FormMessage, SubmitButton } from "@/components/form-fields";
import type { FormState } from "@/lib/forms";
import { enroll } from "./actions";

export function EnrollButton({ courseId, slug }: { courseId: string; slug: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(enroll, {});

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="courseId" value={courseId} />
      <input type="hidden" name="slug" value={slug} />
      <FormMessage error={state.error} />
      <SubmitButton pending={pending}>Inscribirme gratis</SubmitButton>
    </form>
  );
}
