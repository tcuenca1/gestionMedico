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
  - *Buscador y filtros:* Fallo en la reactividad del filtrado en tiempo real sobre listados locales y ausencia inicial de un botón de restablecimiento rápido.
  - *Botones de acción (Llegó / Cancelar):* Inconsistencia en la propagación de estados hacia la API y falta de refresco inmediato de la vista.
  - *Datos relacionales:* Incompatibilidad en alias de columnas SQL que impedían mostrar correctamente el nombre del paciente, médico y especialidad en la tabla principal.

### Módulo Médico
- **A. Funcionalidades Operativas y Activas:**
  - Visualización de la agenda diaria de citas filtrada por estado y horario.
  - Formulario clínico de atención para registro de signos vitales, diagnóstico, tratamiento y recetas.
- **B. Matriz de Errores, Limitaciones Técnicas e Inconsistencias:**
  - *Descalce de ID en JWT:* Fallo en la resolución del identificador de médico logueado al consultar las citas asignadas.
  - *Historial clínico y exámenes:* Enlaces a archivos PDF rotos o inaccesibles por falta de validación de rutas relativas o blobs de memoria.
  - *Asistente de IA y atenciones:* Bloqueo de estados de carga en consultas vacías y dependencia de servicios OCR externos no estables.

### Módulo Paciente
- **A. Funcionalidades Operativas y Activas:**
  - Autenticación mediante credenciales de DNI o correo electrónico y almacenamiento seguro de sesión.
- **B. Matriz de Errores, Limitaciones Técnicas e Inconsistencias:**
  - *Validación de token:* Fallo en el mapeo de roles normalizados al recibir la respuesta HTTP 200 de autenticación.
  - *Redirección en bucle:* Expulsión constante del usuario hacia la pantalla de login al intentar acceder a la ruta protegida `/paciente`.

### Módulo de Chat y WebSocket
- **A. Funcionalidades Operativas y Activas:**
  - Conexión persistente mediante Socket.IO y emisión de eventos en tiempo real.
- **B. Matriz de Errores, Limitaciones Técnicas e Inconsistencias:**
  - *Historial en blanco:* Fallo en la carga inicial de mensajes al abrir una conversación existente por desalineación de IDs en esquemas relacionales.
  - *Mapeo de nombres:* Renderizado predeterminado de la etiqueta "Usuario" debido a la falta de resolución de los campos `Nombre`, `usuario_nombre` o `Username_Correo` en el backend.
  - *Inversión de globos:* Comparación errónea del `remitente_id` frente al identificador de sesión local, alineando los mensajes del emisor en el lado incorrecto.
  - *Huso horario:* Formateo de fechas con conversión UTC/GMT en lugar de la hora local del navegador.

### Módulo de Reportes / PDF
- **A. Funcionalidades Operativas y Activas:**
  - Generación de reportes tabulares de ingresos por rangos de fecha definidos.
- **B. Matriz de Errores, Limitaciones Técnicas e Inconsistencias:**
  - *Redirección a localhost:* Referencias estáticas al puerto `3000` en lugar de utilizar variables de entorno dinámicas (`environment.apiUrl`).
  - *Errores de origen cruzado:* Apertura mediante `window.open()` en lugar de peticiones HTTP GET autenticadas con tipo de respuesta `blob` y headers `Authorization: Bearer <token>`.
  - *Ordenamiento:* Registros ordenados descendentemente (`DESC`) en lugar de mostrarse cronológicamente de menor a mayor (`ASC`).

### Módulo Móvil
- **A. Funcionalidades Operativas y Activas:**
  - Estructura de navegación basada en Expo Router y pantallas de inicio, perfil, pagos y citas.
- **B. Matriz de Errores, Limitaciones Técnicas e Inconsistencias:**
  - *Colisión visual:* Solapamiento de la barra inferior de escritura con la barra de gestos o botones nativos del sistema operativo móvil por falta de componentes `SafeAreaView`.
  - *Diferenciación de mensajes:* Falta de distinción visual robusta entre mensajes enviados y recibidos en las vistas de chat móvil.

---

## 3. JUSTIFICACIÓN TÉCNICA Y MATRIZ DE RIESGOS PARA SUSTENTACIÓN

1. **Incompatibilidad de CORS y manejo de streams binarios:** 
   *Justificación:* La descarga directa de archivos PDF mediante redirecciones de navegador (`window.open`) rompe los encabezados de seguridad y el contexto de autenticación Bearer. Se solventa mediante interceptores HTTP y conversión a objetos Blob en memoria.
2. **Descalce de tipado ORM/SQL:** 
   *Justificación:* Las diferencias de nomenclatura entre PostgreSQL (snake_case) y los modelos de frontend (PascalCase / camelCase) requieren normalizadores intermedios explícitos para evitar fallos de renderizado en tablas dinámicas.
3. **Estrategia de Guardas de Ruta y Carga Asíncrona:** 
   *Justificación:* Los bloqueos de spinners se producen por la ausencia de manejo terminal (`finalize` / `catchError`) en los observables RxJS cuando el servidor retorna códigos de error HTTP 4xx/5xx.
