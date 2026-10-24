import { z } from "zod";
import { isAllowedVideoUrl } from "@/lib/video";

// Mismos limites que los CHECK de la base; aqui solo para dar mensajes claros
export const courseSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "El título debe tener al menos 3 caracteres")
    .max(150, "El título no puede superar 150 caracteres"),
  shortDescription: z
    .string()
    .trim()
    .min(1, "Escribe una descripción corta")
    .max(300, "La descripción corta no puede superar 300 caracteres"),
  description: z.string().trim().max(10000, "La descripción no puede superar 10000 caracteres"),
  categoryId: z.coerce
    .number({ error: "Selecciona una categoría" })
    .int()
    .positive("Selecciona una categoría"),
});

export const lessonSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Escribe el título de la lección")
    .max(150, "El título no puede superar 150 caracteres"),
  body: z.string().max(50000, "El contenido no puede superar 50000 caracteres"),
  videoUrl: z
    .string()
    .trim()
    .refine((v) => v === "" || isAllowedVideoUrl(v), "Solo se permiten videos de YouTube o Vimeo (https)")
    .transform((v) => (v === "" ? null : v)),
});

export type CourseInput = z.infer<typeof courseSchema>;
export type LessonInput = z.infer<typeof lessonSchema>;
