import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { safeNextPath } from "@/lib/navigation";
import { LoginForm } from "./login-form";

export const metadata = { title: "Iniciar sesión" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const next = safeNextPath((await searchParams).next);
  if (await getCurrentProfile()) redirect(next);

  return (
    <div className="mx-auto max-w-sm space-y-6 py-12">
      <h1 className="text-2xl font-bold">Iniciar sesión</h1>
      <LoginForm next={next} />
      <p className="text-sm text-neutral-600">
        ¿No tienes cuenta?{" "}
        <Link href="/register" className="font-medium text-indigo-600 hover:underline">
          Regístrate
        </Link>
      </p>
    </div>
  );
}
