import Link from "next/link";
import { signOut } from "@/app/(auth)/actions";
import { getCurrentProfile } from "@/lib/auth";

export async function SiteHeader() {
  const profile = await getCurrentProfile();

  return (
    <header className="border-b border-neutral-200 bg-white">
      <nav className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3 text-sm">
        <Link href="/" className="text-lg font-bold text-indigo-600">
          Academia MKT + IA
        </Link>
        <Link href="/" className="text-neutral-700 hover:text-neutral-900">
          Catálogo
        </Link>

        <div className="ml-auto flex items-center gap-4">
          {profile ? (
            <>
              <Link href="/my-courses" className="text-neutral-700 hover:text-neutral-900">
                Mis cursos
              </Link>
              {profile.role === "instructor" && (
                <Link href="/instructor" className="text-neutral-700 hover:text-neutral-900">
                  Panel instructor
                </Link>
              )}
              {profile.role === "admin" && (
                <Link href="/admin/users" className="text-neutral-700 hover:text-neutral-900">
                  Administración
                </Link>
              )}
              <Link href="/profile" className="text-neutral-700 hover:text-neutral-900">
                {profile.displayName}
              </Link>
              <form action={signOut}>
                <button type="submit" className="text-neutral-500 hover:text-neutral-900">
                  Salir
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="text-neutral-700 hover:text-neutral-900">
                Iniciar sesión
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-indigo-600 px-3 py-1.5 font-semibold text-white hover:bg-indigo-700"
              >
                Crear cuenta
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
