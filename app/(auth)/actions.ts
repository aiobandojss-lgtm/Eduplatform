"use server";

import { redirect } from "next/navigation";
import { fieldErrorsFrom, formValue, type FormState } from "@/lib/forms";
import { safeNextPath } from "@/lib/navigation";
import { createClient } from "@/lib/supabase/server";
import { signInSchema, signUpSchema } from "@/lib/validation/auth";

export async function signUp(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signUpSchema.safeParse({
    displayName: formValue(formData, "displayName"),
    email: formValue(formData, "email"),
    password: formValue(formData, "password"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const supabase = await createClient();
  // El rol NO se envia: el trigger de la base siempre crea el perfil como student
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { display_name: parsed.data.displayName } },
  });

  if (error) {
    // Mensaje generico: no confirma ni niega que el email exista
    return { error: "No se pudo crear la cuenta con ese email. Intenta con otro o inicia sesión." };
  }

  // Con "Confirm email" activo en Supabase no hay sesion hasta confirmar
  if (!data.session) {
    return { success: "Revisa tu email para confirmar la cuenta antes de iniciar sesión." };
  }

  redirect("/");
}

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signInSchema.safeParse({
    email: formValue(formData, "email"),
    password: formValue(formData, "password"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    // Generico a proposito: no indica si fallo el email o la contrasena
    return { error: "Email o contraseña incorrectos." };
  }

  redirect(safeNextPath(formValue(formData, "next")));
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
