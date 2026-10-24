import { describe, expect, it } from "vitest";
import { profileSchema, signInSchema, signUpSchema } from "./auth";

describe("signUpSchema", () => {
  const valid = { displayName: "Ana", email: "Ana@Test.com ", password: "12345678" };

  it("acepta datos validos y normaliza el email", () => {
    const result = signUpSchema.parse(valid);
    expect(result.email).toBe("ana@test.com");
  });

  it("rechaza contrasenas de menos de 8 caracteres", () => {
    const result = signUpSchema.safeParse({ ...valid, password: "1234567" });
    expect(result.success).toBe(false);
  });

  it("rechaza emails invalidos y nombres vacios", () => {
    expect(signUpSchema.safeParse({ ...valid, email: "no-es-email" }).success).toBe(false);
    expect(signUpSchema.safeParse({ ...valid, displayName: "   " }).success).toBe(false);
  });

  it("descarta un campo role enviado por el cliente", () => {
    const result = signUpSchema.parse({ ...valid, role: "admin" });
    expect(result).not.toHaveProperty("role");
  });
});

describe("signInSchema", () => {
  it("exige contrasena", () => {
    expect(signInSchema.safeParse({ email: "a@b.co", password: "" }).success).toBe(false);
  });
});

describe("profileSchema", () => {
  it("convierte una bio vacia en null", () => {
    expect(profileSchema.parse({ displayName: "Ana", bio: "  " }).bio).toBeNull();
  });

  it("rechaza bios de mas de 2000 caracteres", () => {
    expect(profileSchema.safeParse({ displayName: "Ana", bio: "x".repeat(2001) }).success).toBe(false);
  });
});
