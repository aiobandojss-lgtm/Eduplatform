import { describe, expect, it } from "vitest";
import { dbErrorMessage } from "./db-errors";

describe("dbErrorMessage", () => {
  it("traduce los codigos propios de los triggers", () => {
    expect(dbErrorMessage({ code: "CP001" }, "x")).toMatch(/al menos una lección/);
    expect(dbErrorMessage({ code: "CP002" }, "x")).toMatch(/Despublícalo/);
  });

  it("traduce errores de permisos y de FK", () => {
    expect(dbErrorMessage({ code: "42501" }, "x")).toMatch(/permiso/);
    expect(dbErrorMessage({ code: "23503" }, "x")).toMatch(/inscritos/);
  });

  it("usa el mensaje por defecto con codigos desconocidos o sin error", () => {
    expect(dbErrorMessage({ code: "99999" }, "Fallo")).toBe("Fallo");
    expect(dbErrorMessage(null, "Fallo")).toBe("Fallo");
  });
});
