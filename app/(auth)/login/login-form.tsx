"use client";

import { useEffect } from "react";
import { FormMessage, SubmitButton, TextField } from "@/components/form-fields";
import { useFormAction } from "@/lib/use-form-action";
import { signIn } from "../actions";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useFormAction(signIn, ["email"]);

  // Tras autenticarse se recarga la app completa: el navegador arranca con la cookie
  // de sesion nueva y sin cache de la navegacion anterior
  useEffect(() => {
    if (state.redirectTo) window.location.assign(state.redirectTo);
  }, [state.redirectTo]);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <FormMessage error={state.error} />
      <TextField label="Email" name="email" type="email" defaultValue={state.values?.email} autoComplete="email" required error={state.fieldErrors?.email} />
      <TextField
        label="Contraseña"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        error={state.fieldErrors?.password}
      />
      <SubmitButton pending={pending || Boolean(state.redirectTo)}>Iniciar sesión</SubmitButton>
    </form>
  );
}
