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
  messageAlign = "left",
}: {
  action: Action;
  fields: Record<string, string>;
  label: string;
  confirmMessage?: string;
  variant?: keyof typeof variants;
  ariaLabel?: string;
  // Lado hacia el que se despliega el mensaje (right para botones alineados a la derecha)
  messageAlign?: "left" | "right";
}) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(action, {});

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (confirmMessage && !window.confirm(confirmMessage)) e.preventDefault();
      }}
      className="relative inline-flex"
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
      {/* Posicion absoluta: el mensaje no cambia el ancho del boton ni desplaza a sus vecinos */}
      {(state.error || state.success) && (
        <span
          role={state.error ? "alert" : "status"}
          className={`absolute top-full z-10 mt-1 whitespace-nowrap rounded bg-white/95 px-1 text-xs ${
            messageAlign === "right" ? "right-0" : "left-0"
          } ${state.error ? "text-red-600" : "text-green-700"}`}
        >
          {state.error ?? state.success}
        </span>
      )}
    </form>
  );
}
