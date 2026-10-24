import { requireProfile } from "@/lib/auth";
import { ProfileForm } from "./profile-form";

export const metadata = { title: "Mi perfil" };

const roleLabels = { student: "Estudiante", instructor: "Instructor", admin: "Administrador" } as const;

export default async function ProfilePage() {
  const profile = await requireProfile("/profile");

  return (
    <div className="mx-auto max-w-lg space-y-6 py-12">
      <div>
        <h1 className="text-2xl font-bold">Mi perfil</h1>
        <p className="mt-1 text-sm text-neutral-600">
          {profile.email} · Rol: <span className="font-medium">{roleLabels[profile.role]}</span>
        </p>
      </div>
      <ProfileForm displayName={profile.displayName} bio={profile.bio} />
    </div>
  );
}
