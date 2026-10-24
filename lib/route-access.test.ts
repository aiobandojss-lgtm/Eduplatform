import { describe, expect, it } from "vitest";
import { routeRuleFor } from "./route-access";

describe("routeRuleFor", () => {
  it("exige rol instructor en el panel y sus subrutas", () => {
    expect(routeRuleFor("/instructor")).toEqual({ requiresAuth: true, role: "instructor" });
    expect(routeRuleFor("/instructor/courses/new")?.role).toBe("instructor");
  });

  it("exige rol admin en /admin", () => {
    expect(routeRuleFor("/admin/users")?.role).toBe("admin");
  });

  it("exige sesion sin rol en mis cursos y el visor", () => {
    expect(routeRuleFor("/my-courses")).toEqual({ requiresAuth: true });
    expect(routeRuleFor("/learn/abc/def")).toEqual({ requiresAuth: true });
  });

  it("no confunde prefijos parecidos ni protege rutas publicas", () => {
    expect(routeRuleFor("/instructors-list")).toBeNull();
    expect(routeRuleFor("/")).toBeNull();
    expect(routeRuleFor("/courses/seo")).toBeNull();
  });
});
