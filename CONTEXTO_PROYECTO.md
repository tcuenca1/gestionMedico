# CONTEXTO TÉCNICO Y ESTADO DE ENTREGABLES DEL PROYECTO

## 1. RESUMEN EJECUTIVO Y ARQUITECTURA DEL SISTEMA
- **Stacks tecnológicos:** 
  - Frontend Web: Angular (Standalone Components, Signals, RxJS, Bootstrap).
  - Backend API: Node.js, Express, TypeScript, Socket.IO, JSON Web Tokens (JWT), BcryptJS.
  - Base de Datos: PostgreSQL.
  - Aplicación Móvil: React Native / Expo Router.
- **Estructura de despliegue:** 
  - Frontend: Vercel.
  - Backend y Base de Datos: Railway.

---

## 2. AUDITORÍA DETALLADA DE MÓDULOS Y FUNCIONALIDADES

### Módulo Administración
- **A. Funcionalidades Operativas y Activas:** 
  - Listado general y visualización de directorios de médicos, pacientes y especialidades.
  - Alta y registro de nuevos médicos y especialidades con validaciones de campos requeridos.
  - Navegación protegida mediante guardas de roles basadas en tokens JWT.
- **B. Matriz de Errores, Limitaciones Técnicas e Inconsistencias:**
  - *Edición de contraseñas de médicos:* Inoperabilidad inicial en la actualización de credenciales de acceso vinculadas a la tabla de usuarios desde el panel de gestión.
  - *Persistencia en eliminación:* Falta de sincronización transaccional en borrados lógicos/físicos, provocando que registros eliminados persistan temporalmente en caché o vistas del dashboard.
  - *Modificación de especialidades:* Bloqueo e hiper-congelamiento ocasional de la interfaz de usuario ante respuestas asíncronas concurrentes sin manejo de estados `finalize()`.

### Módulo Recepción
- **A. Funcionalidades Operativas y Activas:**
  - Panel principal de estadísticas operativas (ingresos del día, citas totales, atendidas y pendientes).
  - Formulario de registro rápido de pacientes con validación de DNI y fecha de nacimiento.
- **B. Matriz de Errores, Limitaciones Técnicas e Inconsistencias:**
  - *Bucle de carga indefinido:* Ausencia de bloques `catchError` en peticiones HTTP concurrentes del dashboard que congelaba el spinner "Cargando citas...".
  - *Módulo de Pagos:* Deshabilitado y removido del alcance web del rol de recepción por simplificación de entregables.

### Módulo Médico
- **A. Funcionalidades Operativas y Activas:**
  - Visualización de la agenda diaria de citas filtrada por estado y horario.
  - Formulario clínico de atención para registro de signos vitales, diagnóstico, tratamiento y recetas.
- **B. Matriz de Errores, Limitaciones Técnicas e Inconsistencias:**
  - *Descalce de ID en JWT:* Fallo en la resolución del identificador de médico logueado al consultar las citas asignadas.
  - *Historial clínico y exámenes:* Enlaces a archivos PDF rotos o inaccesibles por falta de validación de rutas relativas o blobs de memoria.

### Módulo Paciente
- **A. Funcionalidades Operativas y Activas:**
  - Autenticación mediante credenciales de DNI o correo electrónico y almacenamiento seguro de sesión.
  - Visualización exclusiva de citas propias y exámenes médicos en la aplicación móvil y web.

### Módulo de Chat y WebSocket
- **A. Funcionalidades Operativas y Activas:**
  - Conexión persistente mediante Socket.IO y emisión de eventos en tiempo real entre administradores, médicos y pacientes.

### Módulo de Reportes / PDF
- **A. Funcionalidades Operativas y Activas:**
  - Generación de reportes tabulares de ingresos por rangos de fecha definidos en vista administrativa web.

### Módulo Móvil
- **A. Funcionalidades Operativas y Activas:**
  - Acceso restringido exclusivamente a roles 'Administrador', 'Médico' y 'Paciente' (exclusión de recepcionistas).
  - Gestión de citas del paciente sin opción de agendamiento propio y sin visualización de errores de renderizado en vacíos.
