"use client";

import { useActionState } from "react";
import { FormMessage, SubmitButton, TextAreaField, TextField } from "@/components/form-fields";
import type { FormState } from "@/lib/forms";
import { updateProfile } from "./actions";

export function ProfileForm({ displayName, bio }: { displayName: string; bio: string | null }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateProfile, {});

  return (
    <form action={action} className="space-y-4">
      <FormMessage error={state.error} success={state.success} />
      <TextField label="Nombre visible" name="displayName" defaultValue={displayName} required error={state.fieldErrors?.displayName} />
      <TextAreaField
        label="Biografía"
        name="bio"
        rows={5}
        maxLength={2000}
        defaultValue={bio ?? ""}
        placeholder="Cuéntale a tus estudiantes sobre tu experiencia"
        error={state.fieldErrors?.bio}
      />
      <SubmitButton pending={pending}>Guardar cambios</SubmitButton>
    </form>
  );
}
