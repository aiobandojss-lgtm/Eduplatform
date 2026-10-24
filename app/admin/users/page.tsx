import { ActionButton } from "@/components/action-button";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { toggleInstructor } from "./actions";

export const metadata = { title: "Administración de usuarios" };

const roleLabels = { student: "Estudiante", instructor: "Instructor", admin: "Administrador" } as const;
const dateFormat = new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" });

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireRole("admin", "/admin/users");
  const query = ((await searchParams).q ?? "").trim().slice(0, 100);

  const supabase = await createClient();
  const { data: users, error } = await supabase.rpc("admin_list_users", { p_search: query || undefined });
  if (error) throw new Error("No se pudo cargar el listado de usuarios");

  return (
    <div className="space-y-6 py-10">
      <div>
        <h1 className="text-2xl font-bold">Usuarios</h1>
        <p className="mt-1 text-sm text-neutral-600">Decide quién enseña en la plataforma. Se muestran hasta 50 resultados.</p>
      </div>

      <form action="/admin/users" className="flex gap-3">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Buscar por nombre o email"
          className="flex-1 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
          Buscar
        </button>
      </form>

      {users && users.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-600">
              <tr>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Rol</th>
                <th className="px-4 py-3 font-medium">Registro</th>
                <th className="px-4 py-3 font-medium">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-3 font-medium">{user.display_name}</td>
                  <td className="px-4 py-3 text-neutral-600">{user.email}</td>
                  <td className="px-4 py-3">{roleLabels[user.role]}</td>
                  <td className="px-4 py-3 text-neutral-500">{dateFormat.format(new Date(user.created_at))}</td>
                  <td className="px-4 py-3">
                    {user.role === "admin" ? (
                      <span className="text-neutral-400">—</span>
                    ) : user.role === "instructor" ? (
                      <ActionButton
                        action={toggleInstructor}
                        fields={{ userId: user.id, enabled: "false" }}
                        label="Retirar instructor"
                        variant="danger"
                        confirmMessage={`¿Retirar el rol de instructor a ${user.display_name}? Sus cursos dejarán de aparecer en el catálogo.`}
                      />
                    ) : (
                      <ActionButton
                        action={toggleInstructor}
                        fields={{ userId: user.id, enabled: "true" }}
                        label="Hacer instructor"
                        variant="primary"
                      />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-neutral-300 p-10 text-center text-neutral-600">
          No se encontraron usuarios.
        </p>
      )}
    </div>
  );
}
