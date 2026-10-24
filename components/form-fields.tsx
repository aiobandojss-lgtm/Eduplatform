import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

type FieldProps = {
  label: string;
  name: string;
  error?: string;
};

const inputClass =
  "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200";

export function TextField({
  label,
  name,
  error,
  ...props
}: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-neutral-700">{label}</span>
      <input name={name} className={inputClass} aria-invalid={Boolean(error)} {...props} />
      {error && <span className="text-sm text-red-600">{error}</span>}
    </label>
  );
}

export function TextAreaField({
  label,
  name,
  error,
  ...props
}: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-neutral-700">{label}</span>
      <textarea name={name} className={inputClass} aria-invalid={Boolean(error)} {...props} />
      {error && <span className="text-sm text-red-600">{error}</span>}
    </label>
  );
}

export function FormMessage({ error, success }: { error?: string; success?: string }) {
  if (error) {
    return <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>;
  }
  if (success) {
    return <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">{success}</p>;
  }
  return null;
}

export function SubmitButton({ pending, children }: { pending: boolean; children: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
    >
      {pending ? "Procesando..." : children}
    </button>
  );
}
