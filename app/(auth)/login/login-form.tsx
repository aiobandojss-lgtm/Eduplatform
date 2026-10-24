"use client";

import { useActionState } from "react";
import { FormMessage, SubmitButton, TextField } from "@/components/form-fields";
import type { FormState } from "@/lib/forms";
import { signIn } from "../actions";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(signIn, {});

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <FormMessage error={state.error} />
      <TextField label="Email" name="email" type="email" autoComplete="email" required error={state.fieldErrors?.email} />
      <TextField
        label="Contraseña"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        error={state.fieldErrors?.password}
      />
      <SubmitButton pending={pending}>Iniciar sesión</SubmitButton>
    </form>
  );
}
