"use server";

import { revalidatePath } from "next/cache";
import { dbErrorMessage } from "@/lib/db-errors";
import { formValue, type FormState } from "@/lib/forms";
import { isUuid } from "@/lib/instructor";
import { createClient } from "@/lib/supabase/server";

export async function toggleInstructor(_prev: FormState, formData: FormData): Promise<FormState> {
  const userId = formValue(formData, "userId");
  const enabled = formValue(formData, "enabled") === "true";
  if (!isUuid(userId)) return { error: "Usuario inválido." };

  const supabase = await createClient();
  // La funcion verifica en la base que quien llama sea admin
  const { error } = await supabase.rpc("set_instructor_role", { p_target_user: userId, p_enabled: enabled });
  if (error) return { error: dbErrorMessage(error, "No se pudo cambiar el rol.") };

  revalidatePath("/admin/users");
  revalidatePath("/");
  return { success: enabled ? "Ahora es instructor." : "Ahora es estudiante." };
}
