import { z } from "zod";

export const reviewSchema = z.object({
  rating: z.coerce
    .number({ error: "Elige una calificación" })
    .int("Elige una calificación")
    .min(1, "La calificación va de 1 a 5")
    .max(5, "La calificación va de 1 a 5"),
  comment: z
    .string()
    .trim()
    .max(2000, "El comentario no puede superar 2000 caracteres")
    .transform((v) => (v === "" ? null : v)),
});

export type ReviewInput = z.infer<typeof reviewSchema>;
