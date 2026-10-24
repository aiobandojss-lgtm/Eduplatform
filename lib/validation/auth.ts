import { z } from "zod";

// Normaliza antes de validar: z.email().trim() validaria el formato con los espacios incluidos
const emailField = z.string().trim().toLowerCase().pipe(z.email("Ingresa un email válido"));

export const signUpSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "Ingresa tu nombre")
    .max(100, "El nombre no puede superar 100 caracteres"),
  email: emailField,
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

export const signInSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Ingresa tu contraseña"),
});

export const profileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "Ingresa tu nombre")
    .max(100, "El nombre no puede superar 100 caracteres"),
  bio: z
    .string()
    .trim()
    .max(2000, "La biografía no puede superar 2000 caracteres")
    .transform((v) => (v === "" ? null : v)),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
