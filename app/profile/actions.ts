"use server";

import { revalidatePath } from "next/cache";
import { fieldErrorsFrom, formValue, type FormState } from "@/lib/forms";
import { createClient } from "@/lib/supabase/server";
import { profileSchema } from "@/lib/validation/auth";

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = profileSchema.safeParse({
    displayName: formValue(formData, "displayName"),
    bio: formValue(formData, "bio"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error) };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Inicia sesión de nuevo." };

  // Solo display_name y bio: la base rechaza cualquier intento de tocar el rol
  const { error } = await supabase
    .from("profiles")
    .update({ display_name: parsed.data.displayName, bio: parsed.data.bio })
    .eq("id", user.id);

  if (error) return { error: "No se pudo guardar el perfil. Intenta de nuevo." };

  revalidatePath("/", "layout");
  return { success: "Perfil actualizado." };
}
