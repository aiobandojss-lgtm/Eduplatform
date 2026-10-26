# user-access Specification

## Purpose

Gestiona la identidad de los usuarios de la plataforma (registro, sesión y perfil) y el modelo de roles estudiante, instructor y admin que define qué puede hacer cada uno.

## Requirements

### Requirement: Registro con email y contraseña
El sistema MUST permitir que un visitante cree una cuenta con nombre, email y contraseña. Toda cuenta nueva MUST quedar con el rol `student` sin importar los datos que envíe el cliente.

#### Scenario: Registro exitoso
- **WHEN** un visitante envía nombre, un email no registrado y una contraseña de al menos 8 caracteres
- **THEN** el sistema crea la cuenta con rol `student`, inicia la sesión y lo lleva al catálogo

#### Scenario: Email ya registrado
- **WHEN** un visitante intenta registrarse con un email que ya existe
- **THEN** el sistema rechaza el registro y muestra un mensaje de error sin revelar datos de la cuenta existente

#### Scenario: Intento de autoasignarse un rol
- **WHEN** un visitante envía en el registro un rol distinto de `student`
- **THEN** la cuenta se crea igualmente con rol `student`

### Requirement: Inicio y cierre de sesión
El sistema MUST permitir iniciar sesión con email y contraseña y cerrar la sesión activa.

#### Scenario: Credenciales válidas
- **WHEN** un usuario registrado ingresa email y contraseña correctos
- **THEN** el sistema inicia la sesión y la mantiene al navegar entre páginas

#### Scenario: Credenciales inválidas
- **WHEN** un usuario ingresa una contraseña incorrecta
- **THEN** el sistema rechaza el acceso con un mensaje genérico que no indica cuál de los dos datos falló

#### Scenario: Cierre de sesión
- **WHEN** un usuario con sesión activa cierra sesión
- **THEN** el sistema termina la sesión y las páginas protegidas dejan de ser accesibles

### Requirement: Perfil de usuario
Cada usuario MUST tener un perfil con nombre visible, biografía opcional y rol. El usuario MUST poder editar su nombre y biografía, pero no su rol.

#### Scenario: Editar perfil propio
- **WHEN** un usuario actualiza su nombre o biografía
- **THEN** el cambio se guarda y se refleja donde se muestre su perfil

#### Scenario: Intento de cambiar el propio rol
- **WHEN** un usuario que no es admin intenta modificar el rol de su perfil por cualquier vía
- **THEN** el sistema rechaza la operación y el rol no cambia

### Requirement: Asignación del rol instructor por el admin
Solo un usuario con rol `admin` MUST poder otorgar o retirar el rol `instructor` a otro usuario. Ningún usuario MUST poder otorgarse el rol `admin` desde la aplicación.

#### Scenario: Admin promueve a instructor
- **WHEN** un admin otorga el rol `instructor` a un estudiante
- **THEN** ese usuario obtiene acceso al panel de instructor en su siguiente navegación

#### Scenario: Admin retira el rol instructor
- **WHEN** un admin retira el rol `instructor` a un usuario que tiene cursos
- **THEN** el usuario vuelve a `student`, pierde acceso al panel de instructor y sus cursos publicados dejan de aparecer en el catálogo

#### Scenario: No admin intenta asignar roles
- **WHEN** un usuario sin rol `admin` intenta cambiar el rol de otro usuario
- **THEN** el sistema rechaza la operación

### Requirement: Listado de usuarios para el admin
El sistema MUST ofrecer al admin una vista con los usuarios registrados, su rol actual y una búsqueda por nombre o email, desde donde gestiona el rol instructor.

#### Scenario: Admin busca un usuario
- **WHEN** un admin busca por parte del email de un usuario
- **THEN** la vista muestra los usuarios coincidentes con su rol actual

#### Scenario: No admin intenta abrir la vista
- **WHEN** un usuario sin rol `admin` navega a la vista de administración de usuarios
- **THEN** el sistema le niega el acceso
