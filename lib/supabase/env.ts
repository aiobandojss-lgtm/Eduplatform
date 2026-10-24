// Lee las variables publicas de Supabase y falla con un mensaje claro si faltan.
// Se acceden de forma literal para que Next.js las incluya en el bundle del navegador.
export function getSupabaseEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY. Copia .env.example a .env.local y completalas.",
    );
  }

  return { url, anonKey };
}
