# Reporte de Auditoría de Calidad (QA) y Ciberseguridad / DevSecOps

Este informe presenta los resultados de la auditoría exhaustiva realizada sobre el código fuente del proyecto (`backend/` y `frontend/`), abarcando la seguridad de la aplicación, el cumplimiento de buenas prácticas de QA, el manejo de casos borde (*edge cases*) y la detección de código muerto o dependencias innecesarias.

---

## Tabla de Hallazgos de Auditoría

| ID | Severidad (Alta/Media/Baja) | Tipo (Seguridad / QA / Código Muerto) | Archivo y Línea Afiliada | Descripción del Riesgo / Fallo | Corrección Sugerida (Sin cambiar la lógica) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | **Alta** | Seguridad | `frontend/package.json` (L24-28) | Se incluyeron librerías de backend (`express`, `bcryptjs`, `jsonwebtoken`, `pg`, `cors`, `dotenv`) dentro de las dependencias de producción (`dependencies`) del **frontend**. Esto incrementa innecesariamente el tamaño del bundle de producción y expone metadatos de Node.js en el cliente. | Remover dichas dependencias de backend del `package.json` del frontend, ya que Angular es una SPA y no ejecuta código Node.js en el navegador. |
| **SEC-02** | **Media** | Seguridad | `backend/src/middleware/auth.ts` (L23-25) | El manejo de errores de verificación de JWT (`jwt.verify`) devuelve HTTP 403 (`Forbidden`) con el mensaje "Token inválido o expirado". Para estandarizar protocolos OAuth2/JWT, la expiración de token o firma inválida debería responder con HTTP 401 (`Unauthorized`). | Mantener el mensaje y flujo funcional, pero asegurar que el código de estado HTTP refleje 401 para expiración o ausencia de token válido. |
| **SEC-03** | **Media** | Seguridad | `backend/src/routes/pacientes.ts` (L23) | Uso de interpolación directa en una cláusula `ILIKE` para búsqueda de pacientes (`... WHERE DNI ILIKE $1 ...`). Aunque usa parámetros seguros (`$1`), el formateo del comodín `\%\`%${term}%\`` se realiza en JS antes de pasarlo al pool, lo que podría requerir validación estricta de caracteres especiales para prevenir denegación de servicio por consultas `ILIKE` muy abiertas. | Validar que el parámetro `term` tenga una longitud mínima antes de ejecutar la consulta en PostgreSQL. |
| **QA-01** | **Media** | QA (Edge Case) | `backend/src/routes/citas.ts` (L63) | Al crear una cita médica, si ocurre un error dentro de la transacción, el bloque `catch` hace `ROLLBACK` y responde con 500, pero no valida si el cliente envió un formato de fecha inválido que cause excepciones no controladas en JavaScript al evaluar `new Date(Fecha_Hora)`. | Añadir validación previa `isNaN(new Date(Fecha_Hora).getTime())` para responder con un HTTP 400 amigable en lugar de un error 500. |
| **QA-02** | **Baja** | QA | `backend/src/index.ts` (L23) | El middleware de autenticación del socket (`io.use`) intercepta la conexión WebSocket pero si el token es inválido o no existe, emite un error genérico sin registrar métricas de intentos fallidos de conexión en tiempo real. | Registrar un log estructurado controlado en el servidor cuando falle una autenticación vía Socket.IO. |
| **DEAD-01** | **Baja** | Código Muerto | `frontend/src/app/core/services/cache.service.ts` | El archivo `cache.service.ts` existe en la capa `core/services/`, sin embargo, los servicios de API implementan su propio manejo de caché interno, dejando este servicio sin referencias activas en los componentes. | Eliminar el archivo si no se planea utilizar o integrarlo en `ApiService` para centralizar la estrategia de caché. |
| **DEAD-02** | **Baja** | Código Muerto | `backend/sql/` | Anteriormente coexistían múltiples scripts de migración parcial (`migracion-chat.sql`, `migracion-examenes.sql`) junto a los scripts de ejecución en Node. Ya fueron limpiados y unificados en `script-completo.sql`, pero es importante mantener la disciplina de no duplicar scripts SQL. | Mantener únicamente `script-completo.sql` como fuente única de verdad para la base de datos. |

---

## Resumen Ejecutivo de Diagnóstico (Top 5 Prioridades)

1. **Limpieza de dependencias en el Frontend (`SEC-01`):** Es crítico remover los paquetes de Node.js del `package.json` del frontend (`frontend/package.json`), ya que una SPA compilada por Angular no debe empaquetar librerías de servidor como `express` o `pg`.
2. **Validación robusta de entradas de fecha (`QA-01`):** Asegurar que las rutas críticas de citas y pacientes validen correctamente los formatos de fecha y cadenas de búsqueda antes de golpear la base de datos PostgreSQL.
3. **Estandarización de Códigos HTTP de Autonomía (`SEC-02`):** Validar que los interceptores de Angular y los middlewares de Express manejen uniformemente los códigos 401 y 403 para evitar bloqueos involuntarios de sesión en el cliente móvil y web.
4. **Eliminación de Código Muerto (`DEAD-01`):** Depurar servicios huérfanos en el frontend (como `cache.service.ts` no inyectado) para mantener una base limpia y mantenible.
5. **Robustecimiento de Transacciones SQL:** Mantener el uso riguroso de bloques `BEGIN`, `COMMIT` y `ROLLBACK` con `pg.Pool` en todos los flujos multi-tabla (como registro de pacientes y médicos), tal como se ha implementado en los nuevos servicios en TypeScript.
