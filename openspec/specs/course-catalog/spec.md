# course-catalog Specification

## Purpose

Permite a cualquier visitante descubrir los cursos publicados de la plataforma: listarlos, buscarlos, filtrarlos por categoría y ver la ficha de cada curso antes de inscribirse.

## Requirements

### Requirement: Listado público de cursos publicados
El catálogo MUST mostrar, sin necesidad de sesión, únicamente los cursos en estado publicado cuyo instructor conserve el rol `instructor`. Cada tarjeta MUST mostrar título, descripción corta, categoría, nombre del instructor, calificación promedio y número de reseñas.

#### Scenario: Visitante sin sesión ve el catálogo
- **WHEN** un visitante sin sesión abre el catálogo
- **THEN** ve todos los cursos publicados con su información de tarjeta

#### Scenario: Los borradores no aparecen
- **WHEN** existe un curso en estado borrador
- **THEN** ese curso no aparece en el catálogo ni en los resultados de búsqueda para ningún usuario que no sea su instructor

#### Scenario: Catálogo vacío
- **WHEN** no hay ningún curso publicado
- **THEN** el catálogo muestra un mensaje indicando que aún no hay cursos disponibles

### Requirement: Paginación del catálogo
El catálogo MUST entregar los cursos en páginas de tamaño fijo, ordenados por fecha de publicación del más reciente al más antiguo.

#### Scenario: Más cursos que el tamaño de página
- **WHEN** hay más cursos publicados que el tamaño de una página
- **THEN** el catálogo muestra la primera página y permite navegar a las siguientes sin repetir ni omitir cursos

### Requirement: Búsqueda por texto
El catálogo MUST permitir buscar cursos publicados por coincidencia de texto en el título o la descripción, sin distinguir mayúsculas de minúsculas.

#### Scenario: Búsqueda con resultados
- **WHEN** un visitante busca "prompts"
- **THEN** el catálogo muestra solo los cursos publicados cuyo título o descripción contienen ese texto

#### Scenario: Búsqueda sin resultados
- **WHEN** un visitante busca un texto que no coincide con ningún curso publicado
- **THEN** el catálogo muestra un mensaje de "sin resultados" y una forma de limpiar la búsqueda

### Requirement: Filtro por categoría
El sistema MUST ofrecer un conjunto cerrado de categorías gestionado por la plataforma, y el catálogo MUST permitir filtrar por una de ellas, combinable con la búsqueda por texto.

#### Scenario: Filtrar por categoría
- **WHEN** un visitante selecciona la categoría "Paid Ads"
- **THEN** el catálogo muestra solo los cursos publicados de esa categoría

#### Scenario: Filtro y búsqueda combinados
- **WHEN** un visitante selecciona una categoría y además escribe un texto de búsqueda
- **THEN** el catálogo muestra solo los cursos que cumplen ambas condiciones

### Requirement: Ficha de detalle del curso
La ficha de un curso publicado MUST ser pública y mostrar título, descripción completa, categoría, instructor con su biografía, fecha de última actualización, temario (títulos de las lecciones en orden), calificación promedio y reseñas. El contenido de las lecciones MUST NOT mostrarse en la ficha.

#### Scenario: Visitante abre una ficha
- **WHEN** un visitante abre la ficha de un curso publicado
- **THEN** ve la información del curso y los títulos de sus lecciones, pero no su contenido

#### Scenario: Ficha de un curso no publicado
- **WHEN** alguien que no es el instructor dueño abre la dirección de un curso en borrador
- **THEN** el sistema responde como si el curso no existiera
