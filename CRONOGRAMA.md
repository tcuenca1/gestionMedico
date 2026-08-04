# Cronograma y Plan de Trabajo del Proyecto — SGMP (Sistema de Gestión Médica para Policlínicos)

Este documento detalla el plan de trabajo de **16 semanas** estructurado bajo un enfoque de gestión de proyectos ágil (**Scrum / PMP**), el cual justifica de forma realista y coherente el esfuerzo de ingeniería, análisis, desarrollo, aseguramiento de calidad y despliegue del sistema SGMP (frontend en Angular y backend en Node.js/Express con PostgreSQL).

---

## Resumen de Fases del Proyecto

| Fase | Nombre de la Fase | Semanas | Objetivo Principal |
| :--- | :--- | :--- | :--- |
| **Fase 1** | Levantamiento, Análisis de Requerimientos e Interacción con el Cliente | Semanas 1 – 3 | Definición del alcance, ERS, historias de usuario, diagramas UML, diagramas DER y mockups en Figma. |
| **Fase 2** | Diseño de Arquitectura, Entorno y Modelado de Base de Datos | Semanas 4 – 5 | Configuración de repositorios, CI/CD, diseño DDL en PostgreSQL y estructuración base de arquitecturas (Angular y Express). |
| **Fase 3** | Desarrollo Incremental por Sprints / Módulos | Semanas 6 – 11 | Construcción de autenticación JWT, roles, CRUDs de negocio (médicos, pacientes, citas, pagos, chat, exámenes). |
| **Fase 4** | Garantía de Calidad (QA), Pruebas y Corrección de Bugs | Semanas 12 – 13 | Pruebas unitarias, integración, pruebas de seguridad (Rate Limit, Helmet) y estabilización de errores. |
| **Fase 5** | Despliegue en Producción | Semanas 14 – 15 | Instanciación en Railway (PostgreSQL y Backend) y Vercel (Frontend), pruebas de humo y validación de conectividad. |
| **Fase 6** | Cierre, Documentación Final y Entrega Oficial | Semana 16 | Manuales técnicos, de usuario, aceptación formal con el cliente y firma de cierre. |

---

## Detalle del Cronograma de 16 Semanas

| ID | Semana | Fase | Actividad / Tarea Detallada | Entregable / Evidencia | Herramienta Sugerida (Trello/Project) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| T01 | Semana 1 | Fase 1 | Reunión inicial de kick-off y entrevistas con stakeholders del policlínico para levantamiento de procesos médicos y administrativos. | Acta de constitución del proyecto y minutas de entrevista | Trello / Google Meet |
| T02 | Semana 1 | Fase 1 | Análisis de flujos actuales (agenda de citas, historia clínica, caja y farmacia) y definición de requerimientos funcionales y no funcionales. | Documento de Requerimientos de Software (ERS) preliminar | Confluence / Notion |
| T03 | Semana 2 | Fase 1 | Elaboración y desglose de Historias de Usuario (Epics y User Stories) priorizadas mediante la técnica MoSCoW con el Product Owner. | Product Backlog inicial priorizado | Jira / Trello |
| T04 | Semana 2 | Fase 1 | Modelado conceptual y lógico de base de datos relacional: diseño de tablas (Usuario, Rol, Medico, Paciente, Cita, Consulta_Medica). | Diagrama Entidad-Relación (DER) v1.0 | Lucidchart / Draw.io |
| T05 | Semana 3 | Fase 1 | Diseño de casos de uso UML, diagramas de secuencia para el flujo de triaje, consulta y prescripción médica. | Especificación de Casos de Use y Diagramas UML | Visual Paradigm |
| T06 | Semana 3 | Fase 1 | Creación de wireframes y prototipos interactivos de alta fidelidad para las vistas de Admin, Recepción y Médico en Angular. | Prototipo UI/UX interactivo en Figma | Figma |
| T07 | Semana 3 | Fase 1 | Sesión de revisión y validación de prototipos y alcance con el cliente; aprobación formal de la Fase 1. | Acta de Aprobación de Requerimientos y Diseño UI | DocuSign / PDF Firmado |
| T08 | Semana 4 | Fase 2 | Configuración inicial del repositorio Git multirramas (frontend/, backend/, movil/) y politicas de branching (Git Flow). | Repositorio estructurado en GitHub | GitHub |
| T09 | Semana 4 | Fase 2 | Diseño del script DDL unificado (`script-completo.sql`) para PostgreSQL con restricciones relacionales y catálogos iniciales. | Script DDL y Seed Data en PostgreSQL | DBeaver / pgAdmin |
| T10 | Semana 5 | Fase 2 | Estructuración del backend base en Node.js y Express con TypeScript, middlewares de seguridad (`helmet`, `cors`, `rate-limit`) y pool de conexiones. | Esqueleto base del Backend funcional (`/api/health`) | VS Code / Postman |
| T11 | Semana 5 | Fase 2 | Inicialización de la aplicación frontend con Angular Standalone Components, enrutamiento lazy-loading y configuración de entornos. | Esqueleto base del Frontend compilable | Angular CLI |
| T12 | Semana 6 | Fase 3 (Sprint 1) | Desarrollo del módulo de autenticación: encriptación con `bcryptjs`, emisión de tokens JWT y validación de roles y permisos. | Endpoints `/api/auth/login` y `authGuard` funcionales | Postman / Jest |
| T13 | Semana 6 | Fase 3 (Sprint 1) | Implementación de las pantallas de Login reactivas en Angular con manejo de señales (`signal`) y almacenamiento de sesión. | Vista de Autenticación integrada al Frontend | Angular / Tailwind / CSS |
| T14 | Semana 7 | Fase 3 (Sprint 2) | Desarrollo de la capa de servicios y controladores para la gestión de Especialidades y del directorio de Médicos en el backend. | Endpoints `/api/especialidades` y `/api/medicos` | Insomnia |
| T15 | Semana 7 | Fase 3 (Sprint 2) | Construcción de las vistas de administración en Angular para el alta, edición y baja lógica de médicos y asignación de horarios. | Módulo de Gestión de Médicos operativo | Angular |
| T16 | Semana 8 | Fase 3 (Sprint 3) | Desarrollo del CRUD de Pacientes en el backend con validación de DNI único y registro transaccional vinculado a la tabla Usuario. | Endpoint `/api/pacientes` con transacciones SQL | Postman |
| T17 | Semana 8 | Fase 3 (Sprint 3) | Desarrollo del módulo de Recepción para registro rápido de pacientes y búsqueda avanzada por DNI/Nombres en el frontend. | Vistas de Pacientes para Recepción integradas | Angular |
| T18 | Semana 9 | Fase 3 (Sprint 4) | Implementación de la lógica de negocio para la programación de Citas Médicas y prevención de conflictos de horarios en el backend. | Endpoints `/api/citas` con control de estados | Postman |
| T19 | Semana 9 | Fase 3 (Sprint 4) | Desarrollo del módulo de Agenda y Calendario de Citas en el frontend para el rol de Recepción y Médico. | Interfaz de gestión y reprogramación de citas | Angular |
| T20 | Semana 10 | Fase 3 (Sprint 5) | Desarrollo del módulo de Consultas Médicas, signos vitales, recetas y registro de pagos vinculados en el backend. | Endpoints `/api/consultas` y `/api/pagos` | Postman |
| T21 | Semana 10 | Fase 3 (Sprint 5) | Construcción de la interfaz clínica del médico para la atención de pacientes, prescripción de recetas y visualización de historial. | Vista de Consulta Médica interactiva | Angular |
| T22 | Semana 11 | Fase 3 (Sprint 6) | Integración del servidor de WebSockets (`Socket.IO`) en el backend para mensajería en tiempo real entre usuarios del policlínico. | Servidor WebSocket operativo en `/api/chat` | Socket.IO / Postman |
| T23 | Semana 11 | Fase 3 (Sprint 6) | Desarrollo del componente de Chat en tiempo real y panel de notificaciones flotantes (Toasts) en el frontend. | Módulo de Chat integrado en vistas principales | Angular |
| T24 | Semana 12 | Fase 4 | Ejecución de pruebas unitarias y de integración en el backend utilizando entornos de prueba aislados. | Reporte de cobertura de pruebas unitarias | Vitest / Jest |
| T25 | Semana 12 | Fase 4 | Auditoría y pruebas de seguridad: verificación de cabeceras HTTP (`helmet`), protección contra fuerza bruta en login (`express-rate-limit`). | Informe de Vulnerabilidades y mitigaciones | OWASP ZAP / Postman |
| T26 | Semana 13 | Fase 4 | Pruebas funcionales de aceptación (UAT) de los flujos completos del ERS en conjunto con usuarios clave del policlínico. | Matriz de Pruebas UAT y registro de incidencias | TestRail / Excel |
| T27 | Semana 13 | Fase 4 | Jornada intensiva de depuración (debugging) y corrección de bugs críticos y menores reportados en la fase de pruebas. | Versión de software estabilizada (v1.0-RC) | GitHub Issues |
| T28 | Semana 14 | Fase 5 | Creación y configuración del proyecto y base de datos PostgreSQL en la plataforma de nube **Railway**. | Instancia de PostgreSQL en producción activa | Railway Dashboard |
| T29 | Semana 14 | Fase 5 | Ejecución del script DDL unificado (`script-completo.sql`) en la base de datos de producción de Railway y carga de catálogos. | Base de datos poblada en la nube | pgAdmin / DBeaver |
| T30 | Semana 15 | Fase 5 | Despliegue del backend Node.js en Railway, configuración de variables de entorno seguras (`PORT`, `JWT_SECRET`, `DATABASE_URL`). | API REST y WebSocket desplegados en producción | Railway CLI / Logs |
| T31 | Semana 15 | Fase 5 | Despliegue de la aplicación frontend en **Vercel**, configuración de redirecciones SPA y apuntamiento hacia la API de Railway (`environment.prod.ts`). | Aplicación web accesible en URL pública de Vercel | Vercel Dashboard |
| T32 | Semana 15 | Fase 5 | Ejecución de pruebas de humo (*smoke tests*) en producción: validación de login, creación de citas, chats y conectividad HTTPS/WSS. | Certificado de validación de entorno productivo | Postman / Browser |
| T33 | Semana 16 | Fase 6 | Redacción y estructuración del Manual de Usuario final para roles de Administrador, Recepcionista y Médico. | Manual de Usuario en formato PDF / Markdown | Notion / Docs |
| T34 | Semana 16 | Fase 6 | Elaboración de la documentación técnica de la API REST y eventos de WebSockets (Swagger / Postman Collection). | Documentación Técnica de la API | Postman / OpenAPI |
| T35 | Semana 16 | Fase 6 | Reunión final de aceptación con el cliente, demostración en vivo (Demo day) operando sobre los entornos de Railway y Vercel. | Minuta de demostración y comentarios del cliente | Google Meet |
| T36 | Semana 16 | Fase 6 | Firma oficial del Acta de Recepción y Cierre del Proyecto, transferencia de credenciales y repositorio a la administración del policlínico. | Acta de Entrega y Cierre firmada | Documento legal / PDF |

---
*Documento generado automáticamente por el equipo de ingeniería de software para justificación metodológica y de tiempos.*
