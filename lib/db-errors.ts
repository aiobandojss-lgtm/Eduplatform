// Traduce los codigos de error de Postgres/PostgREST a mensajes para el usuario.
// Los codigos CPxxx los definen nuestros triggers (ver migracion de reglas de publicacion).
const MESSAGES: Record<string, string> = {
  CP001: "Agrega al menos una lección antes de publicar el curso.",
  CP002: "No puedes eliminar la única lección de un curso publicado. Despublícalo primero.",
  CP003: "El orden de las lecciones cambió. Recarga la página e intenta de nuevo.",
  "42501": "No tienes permiso para realizar esta acción.",
  "23503": "Este curso tiene estudiantes inscritos: no se puede eliminar, solo despublicar.",
  "23505": "Ya existe un registro con esos datos.",
  "23514": "Algún dato no cumple las reglas. Revisa las longitudes y la URL del video.",
};

export function dbErrorMessage(error: { code?: string } | null | undefined, fallback: string): string {
  return (error?.code && MESSAGES[error.code]) || fallback;
}
