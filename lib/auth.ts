import { redirect } from "next/navigation";
import { cache } from "react";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type UserRole = Database["public"]["Enums"]["user_role"];

export type CurrentProfile = {
  id: string;
  email: string;
  displayName: string;
  bio: string | null;
  role: UserRole;
};

// cache() evita repetir la consulta cuando layout y pagina la piden en el mismo request
export const getCurrentProfile = cache(async (): Promise<CurrentProfile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, bio, role")
    .eq("id", user.id)
    .single();
  if (!profile) return null;

  return {
    id: user.id,
    email: user.email ?? "",
    displayName: profile.display_name,
    bio: profile.bio,
    role: profile.role,
  };
});

// Defensa en profundidad para paginas protegidas; la seguridad real esta en RLS
export async function requireProfile(nextPath: string): Promise<CurrentProfile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  return profile;
}

export async function requireRole(role: UserRole, nextPath: string): Promise<CurrentProfile> {
  const profile = await requireProfile(nextPath);
  if (profile.role !== role) redirect("/");
  return profile;
}
