"use client";

import { useTransition } from "react";
import { signOut } from "@/app/(auth)/actions";

export function SignOutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await signOut();
          // Navegacion completa: la siguiente pagina se pide ya sin cookies de sesion
          window.location.assign("/");
        })
      }
      className="text-neutral-500 hover:text-neutral-900 disabled:opacity-50"
    >
      {pending ? "Saliendo..." : "Salir"}
    </button>
  );
}
