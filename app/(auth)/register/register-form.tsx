"use client";

import { useActionState } from "react";
import { FormMessage, SubmitButton, TextField } from "@/components/form-fields";
import type { FormState } from "@/lib/forms";
import { signUp } from "../actions";

export function RegisterForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(signUp, {});

  return (
    <form action={action} className="space-y-4">
      <FormMessage error={state.error} success={state.success} />
      <TextField label="Nombre" name="displayName" autoComplete="name" required error={state.fieldErrors?.displayName} />
      <TextField label="Email" name="email" type="email" autoComplete="email" required error={state.fieldErrors?.email} />
      <TextField
        label="Contraseña"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
        error={state.fieldErrors?.password}
      />
      <SubmitButton pending={pending}>Crear cuenta</SubmitButton>
    </form>
  );
}
