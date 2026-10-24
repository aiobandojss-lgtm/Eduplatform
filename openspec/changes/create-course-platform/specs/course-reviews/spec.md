# Spec Delta

## Purpose

Permite que los estudiantes inscritos califiquen y comenten los cursos, y expone la calificación promedio como señal de calidad en el catálogo y en la ficha del curso.

## ADDED Requirements

### Requirement: Solo inscritos pueden reseñar
Un usuario MUST poder crear una reseña de un curso solo si está inscrito en él. El dueño del curso MUST NOT poder reseñar su propio curso.

#### Scenario: Inscrito deja una reseña
- **WHEN** un estudiante inscrito envía una calificación de 1 a 5 y un comentario opcional
- **THEN** la reseña se guarda y aparece en la ficha del curso con su nombre y la fecha

#### Scenario: No inscrito intenta reseñar
- **WHEN** un usuario no inscrito intenta crear una reseña del curso por cualquier vía
- **THEN** el sistema rechaza la operación

#### Scenario: Dueño intenta reseñar su curso
- **WHEN** el instructor dueño intenta crear una reseña de su curso
- **THEN** el sistema rechaza la operación

### Requirement: Una reseña por estudiante y curso
Cada estudiante MUST tener como máximo una reseña por curso. La calificación MUST ser un entero entre 1 y 5, y el comentario MUST NOT superar 2000 caracteres.

#### Scenario: Segunda reseña del mismo estudiante
- **WHEN** un estudiante que ya reseñó un curso intenta crear otra reseña del mismo curso
- **THEN** el sistema no crea una segunda reseña y le ofrece editar la existente

#### Scenario: Calificación fuera de rango
- **WHEN** se envía una reseña con calificación 0 o 6
- **THEN** el sistema rechaza la reseña

### Requirement: Editar y eliminar la propia reseña
El autor de una reseña MUST poder editarla o eliminarla. Ningún otro usuario MUST poder modificar o eliminar una reseña ajena.

#### Scenario: Autor edita su reseña
- **WHEN** el autor cambia la calificación o el comentario de su reseña
- **THEN** la reseña muestra los nuevos valores y el promedio del curso se recalcula

#### Scenario: Usuario intenta borrar una reseña ajena
- **WHEN** un usuario intenta eliminar una reseña de otra persona
- **THEN** el sistema rechaza la operación y la reseña se mantiene

### Requirement: Lectura pública de reseñas
Las reseñas de un curso publicado MUST ser visibles para cualquier visitante en la ficha del curso, ordenadas de la más reciente a la más antigua.

#### Scenario: Visitante lee reseñas
- **WHEN** un visitante sin sesión abre la ficha de un curso publicado con reseñas
- **THEN** ve las reseñas con calificación, comentario, nombre del autor y fecha

### Requirement: Calificación promedio del curso
El sistema MUST mostrar para cada curso la calificación promedio redondeada a un decimal y el número total de reseñas, siempre consistentes con las reseñas existentes.

#### Scenario: Curso con reseñas
- **WHEN** un curso tiene reseñas con calificaciones 5, 4 y 4
- **THEN** el catálogo y la ficha muestran un promedio de 4.3 y 3 reseñas

#### Scenario: Curso sin reseñas
- **WHEN** un curso no tiene reseñas
- **THEN** el catálogo y la ficha indican "Sin reseñas" en lugar de un promedio
