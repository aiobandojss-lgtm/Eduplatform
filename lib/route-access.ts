import type { UserRole } from "@/lib/auth";

export type RouteRule = { requiresAuth: boolean; role?: UserRole };

// Reglas de acceso por prefijo de ruta (design D1). Solo mejoran la UX:
// la autorizacion real la hace RLS en la base.
const RULES: Array<{ prefix: string; rule: RouteRule }> = [
  { prefix: "/instructor", rule: { requiresAuth: true, role: "instructor" } },
  { prefix: "/admin", rule: { requiresAuth: true, role: "admin" } },
  { prefix: "/my-courses", rule: { requiresAuth: true } },
  { prefix: "/learn", rule: { requiresAuth: true } },
  { prefix: "/profile", rule: { requiresAuth: true } },
];

export function routeRuleFor(pathname: string): RouteRule | null {
  const match = RULES.find(
    ({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  return match?.rule ?? null;
}
