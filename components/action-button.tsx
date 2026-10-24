"use client";

import { useActionState } from "react";
import type { FormState } from "@/lib/forms";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;

const variants = {
  primary: "bg-indigo-600 text-white hover:bg-indigo-700",
  secondary: "border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50",
  danger: "border border-red-300 bg-white text-red-700 hover:bg-red-50",
  ghost: "text-neutral-500 hover:text-neutral-900",
} as const;

// Boton que ejecuta un Server Action con campos ocultos y muestra su error en linea
export function ActionButton({
  action,
  fields,
  label,
  confirmMessage,
  variant = "secondary",
  ariaLabel,
}: {
  action: Action;
  fields: Record<string, string>;
  label: string;
  confirmMessage?: string;
  variant?: keyof typeof variants;
  ariaLabel?: string;
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, {});

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (confirmMessage && !window.confirm(confirmMessage)) e.preventDefault();
      }}
      className="inline-flex flex-col items-start gap-1"
    >
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <button
        type="submit"
        disabled={pending}
        aria-label={ariaLabel}
        className={`rounded-md px-3 py-1.5 text-sm font-medium disabled:opacity-50 ${variants[variant]}`}
      >
        {pending ? "..." : label}
      </button>
      {state.error && <span className="text-xs text-red-600">{state.error}</span>}
      {state.success && <span className="text-xs text-green-700">{state.success}</span>}
    </form>
  );
}
