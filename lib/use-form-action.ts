"use client";

import { useActionState } from "react";
import type { FormState } from "@/lib/forms";

type ServerAction = (prev: FormState, formData: FormData) => Promise<FormState>;

export type FormStateWithValues = FormState & { values?: Record<string, string> };

// React 19 resetea el <form> al terminar un Server Action, incluso si fallo la validacion.
// Este hook guarda en el cliente lo que el usuario envio para usarlo como defaultValue,
// asi el reset deja los datos escritos. Solo se conservan los campos indicados
// (nunca incluir contrasenas).
export function useFormAction(action: ServerAction, keepFields: readonly string[]) {
  return useActionState<FormStateWithValues, FormData>(async (prev, formData) => {
    const result = await action(prev, formData);
    const values: Record<string, string> = {};
    for (const key of keepFields) {
      const value = formData.get(key);
      if (typeof value === "string") values[key] = value;
    }
    return { ...result, values };
  }, {});
}
