import { NextResponse, type NextRequest } from "next/server";
import { routeRuleFor } from "@/lib/route-access";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { response, user, supabase } = await updateSession(request);
  const { pathname, search } = request.nextUrl;
  const rule = routeRuleFor(pathname);

  if (!rule) return response;

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${search}`);
    return redirectWithCookies(loginUrl, response);
  }

  if (rule.role) {
    // El rol se lee de la base en cada request: una degradacion aplica en la siguiente navegacion
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== rule.role) {
      return redirectWithCookies(new URL("/", request.url), response);
    }
  }

  return response;
}

// Conserva las cookies de sesion refrescadas al redirigir
function redirectWithCookies(url: URL, from: NextResponse) {
  const redirect = NextResponse.redirect(url);
  from.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

export const config = {
  // Excluye assets estaticos e imagenes para no consultar Auth en cada archivo
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
