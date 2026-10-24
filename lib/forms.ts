import type { z } from "zod";

// Estado que devuelven los Server Actions de formularios a useActionState
export type FormState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string | undefined>;
};

export function fieldErrorsFrom(error: z.ZodError): Record<string, string | undefined> {
  const errors: Record<string, string | undefined> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    errors[key] ??= issue.message;
  }
  return errors;
}

export function formValue(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
