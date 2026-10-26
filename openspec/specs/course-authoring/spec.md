# course-authoring Specification

## Purpose

Permite que cada instructor cree y mantenga sus propios cursos y lecciones, y controle cuándo un curso es visible en el catálogo mediante el ciclo borrador / publicado.

## Requirements

### Requirement: Solo instructores crean cursos
Solo un usuario con rol `instructor` MUST poder crear cursos. El curso creado MUST quedar asignado a ese instructor como dueño y en estado borrador.

#### Scenario: Instructor crea un curso
- **WHEN** un instructor crea un curso con título, descripción corta, descripción completa y categoría
- **THEN** el curso queda guardado en estado borrador con él como dueño y aparece en su panel

#### Scenario: Estudiante intenta crear un curso
- **WHEN** un usuario con rol `student` intenta crear un curso por cualquier vía
- **THEN** el sistema rechaza la operación

#### Scenario: Datos obligatorios faltantes
- **WHEN** un instructor intenta guardar un curso sin título o sin categoría
- **THEN** el sistema rechaza el guardado e indica los campos faltantes

### Requirement: Solo el dueño gestiona su curso
Un instructor MUST poder ver, editar y eliminar únicamente los cursos de los que es dueño. Ningún otro usuario MUST poder modificar un curso ajeno.

#### Scenario: Instructor edita su curso
- **WHEN** el dueño cambia el título o la descripción de su curso
- **THEN** el cambio se guarda y se actualiza la fecha de última actualización del curso

#### Scenario: Instructor intenta editar un curso ajeno
- **WHEN** un instructor intenta modificar o eliminar un curso de otro instructor
- **THEN** el sistema rechaza la operación y el curso no cambia

### Requirement: Panel del instructor
El sistema MUST ofrecer a cada instructor un panel con todos sus cursos, en borrador y publicados, mostrando estado, número de lecciones, número de inscritos y calificación promedio.

#### Scenario: Instructor abre su panel
- **WHEN** un instructor abre su panel
- **THEN** ve solo sus cursos con su estado y métricas, y no ve cursos de otros instructores

### Requirement: Gestión de lecciones
El dueño de un curso MUST poder crear, editar, reordenar y eliminar lecciones de ese curso. Cada lección MUST tener título y contenido de texto, y MAY tener una URL de video embebido.

#### Scenario: Agregar una lección
- **WHEN** el dueño agrega una lección con título y contenido
- **THEN** la lección se guarda al final del orden del curso

#### Scenario: Reordenar lecciones
- **WHEN** el dueño cambia la posición de una lección
- **THEN** el temario del curso refleja el nuevo orden, sin posiciones repetidas

#### Scenario: URL de video no permitida
- **WHEN** el dueño ingresa una URL de video que no pertenece a un proveedor permitido (YouTube o Vimeo)
- **THEN** el sistema rechaza el guardado de la lección e indica el error

#### Scenario: Eliminar la última lección de un curso publicado
- **WHEN** el dueño intenta eliminar la única lección de un curso publicado
- **THEN** el sistema rechaza la eliminación e indica que primero debe despublicar el curso

#### Scenario: Usuario ajeno intenta editar lecciones
- **WHEN** un usuario que no es dueño del curso intenta crear, editar o eliminar una lección de ese curso
- **THEN** el sistema rechaza la operación

### Requirement: Publicar y despublicar un curso
El dueño MUST poder publicar un curso en borrador y despublicar uno publicado. Un curso MUST NOT poder publicarse si no tiene al menos una lección.

#### Scenario: Publicación exitosa
- **WHEN** el dueño publica un curso con al menos una lección
- **THEN** el curso pasa a publicado, se registra su fecha de publicación y aparece en el catálogo

#### Scenario: Publicar un curso sin lecciones
- **WHEN** el dueño intenta publicar un curso sin lecciones
- **THEN** el sistema rechaza la publicación e indica que se requiere al menos una lección

#### Scenario: Despublicar un curso
- **WHEN** el dueño despublica un curso publicado
- **THEN** el curso vuelve a borrador y deja de aparecer en el catálogo

### Requirement: Eliminar un curso
El dueño MUST poder eliminar un curso solo si no tiene estudiantes inscritos. Un curso con inscritos solo MUST poder despublicarse.

#### Scenario: Eliminar curso sin inscritos
- **WHEN** el dueño elimina un curso sin inscritos
- **THEN** el curso y sus lecciones se eliminan definitivamente

#### Scenario: Eliminar curso con inscritos
- **WHEN** el dueño intenta eliminar un curso que tiene al menos un inscrito
- **THEN** el sistema rechaza la eliminación y sugiere despublicarlo
