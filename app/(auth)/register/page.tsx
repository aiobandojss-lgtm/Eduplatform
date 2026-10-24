import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { RegisterForm } from "./register-form";

export const metadata = { title: "Crear cuenta" };

export default async function RegisterPage() {
  if (await getCurrentProfile()) redirect("/");

  return (
    <div className="mx-auto max-w-sm space-y-6 py-12">
      <h1 className="text-2xl font-bold">Crear cuenta</h1>
      <RegisterForm />
      <p className="text-sm text-neutral-600">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-medium text-indigo-600 hover:underline">
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}
