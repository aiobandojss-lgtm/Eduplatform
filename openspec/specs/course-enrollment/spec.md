# course-enrollment Specification

## Purpose

Gestiona la inscripción gratuita de estudiantes a cursos publicados y determina quién puede acceder al contenido de las lecciones de cada curso.

## Requirements

### Requirement: Inscripción a un curso publicado
Un usuario con sesión iniciada MUST poder inscribirse gratuitamente en cualquier curso publicado del que no sea dueño. Un usuario MUST NOT poder inscribirse dos veces en el mismo curso.

#### Scenario: Inscripción exitosa
- **WHEN** un estudiante con sesión pulsa "Inscribirme" en la ficha de un curso publicado
- **THEN** queda inscrito, la ficha pasa a mostrar "Ir al curso" y el curso aparece en "Mis cursos"

#### Scenario: Visitante sin sesión intenta inscribirse
- **WHEN** un visitante sin sesión pulsa "Inscribirme"
- **THEN** el sistema le pide iniciar sesión y, al hacerlo, lo regresa a la ficha del curso

#### Scenario: Inscripción duplicada
- **WHEN** un usuario ya inscrito intenta inscribirse de nuevo en el mismo curso
- **THEN** el sistema no crea una segunda inscripción

#### Scenario: Inscripción a un curso en borrador
- **WHEN** un usuario intenta inscribirse en un curso que no está publicado
- **THEN** el sistema rechaza la inscripción

#### Scenario: Instructor intenta inscribirse en su propio curso
- **WHEN** el dueño de un curso intenta inscribirse en él
- **THEN** el sistema rechaza la inscripción

### Requirement: Acceso al contenido de las lecciones
El contenido de una lección MUST ser accesible solo para los estudiantes inscritos en su curso y para el dueño del curso. Cualquier otro usuario MUST NOT poder leerlo por ninguna vía.

#### Scenario: Estudiante inscrito abre una lección
- **WHEN** un estudiante inscrito abre una lección del curso
- **THEN** ve el contenido de texto y, si existe, el video embebido

#### Scenario: Usuario no inscrito intenta leer una lección
- **WHEN** un usuario no inscrito intenta abrir una lección o consultar su contenido directamente
- **THEN** el sistema no entrega el contenido y lo redirige a la ficha del curso

### Requirement: Navegación dentro del curso
La vista de un curso para un inscrito MUST mostrar el temario en orden y permitir pasar a la lección anterior y a la siguiente.

#### Scenario: Pasar a la siguiente lección
- **WHEN** un inscrito está en una lección que no es la última y pulsa "Siguiente"
- **THEN** el sistema muestra la siguiente lección según el orden del temario

### Requirement: Mis cursos
Cada usuario con sesión MUST tener una vista "Mis cursos" con los cursos en los que está inscrito, ordenados por fecha de inscripción, del más reciente al más antiguo.

#### Scenario: Estudiante con inscripciones
- **WHEN** un estudiante abre "Mis cursos"
- **THEN** ve todos los cursos en los que está inscrito con acceso directo a cada uno

#### Scenario: Estudiante sin inscripciones
- **WHEN** un estudiante sin inscripciones abre "Mis cursos"
- **THEN** ve un mensaje con un enlace al catálogo

### Requirement: Acceso tras despublicar
Si un curso se despublica, los estudiantes ya inscritos MUST conservar el acceso a sus lecciones, y MUST NOT admitirse inscripciones nuevas mientras siga en borrador.

#### Scenario: Curso despublicado con inscritos
- **WHEN** el dueño despublica un curso y luego un estudiante ya inscrito abre "Mis cursos"
- **THEN** el estudiante sigue viendo el curso y puede abrir sus lecciones
