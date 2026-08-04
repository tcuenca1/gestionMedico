# SGMP Movil

Aplicacion movil (React Native + Expo Router) del **Sistema de Gestion de Clinica
Medica**. No incluye servidor: es un **cliente del backend existente** de
`GestionMedico` (Node.js + Express 4 + Socket.IO + PostgreSQL), descrito en el
informe tecnico del proyecto.

## Requisitos

- Node.js 18 o superior
- El backend de GestionMedico corriendo y accesible
- Expo Go en el telefono, o un emulador Android / simulador iOS

## Instalacion

    npm install
    npx expo start

Escanea el QR con Expo Go.

## Configurar la URL del backend

Por defecto la app usa la IP del PC que sirve Expo con el puerto **3000**, que
es lo habitual en desarrollo local. Para apuntar a otro servidor, edita
`app.json`:

    "extra": { "apiUrl": "https://mi-servidor.com/api" }

`src/config.js` deriva de ahi dos valores: `API_URL` (REST) y `SERVIDOR_URL`
(raiz, usada por Socket.IO).

## Modo demostracion

Mientras el backend no este disponible, la app funciona con datos simulados.
Se controla desde `app.json`:

    "extra": { "apiUrl": "http://192.168.1.51:3000/api", "demo": true }

Con `demo: true` ninguna peticion sale a la red: las responde `src/demo.js`,
que imita el contrato real del backend (mismos nombres de columna, mismos
codigos de error y las mismas reglas de negocio, incluida la reprogramacion
automatica de citas en conflicto). El chat usa un emisor local con los mismos
nombres de evento de Socket.IO, asi que las pantallas no cambian.

Usuarios de la demo:

| Usuario    | Contrasena     | Rol            |
|------------|----------------|----------------|
| admin      | admin123       | Administrador  |
| recepcion  | recepcion123   | Recepcionista  |
| medico     | medico123      | Medico         |
| paciente   | paciente123    | Paciente       |

Para conectar el backend real basta con poner `"demo": false` y ajustar
`apiUrl`. No hay que tocar ninguna pantalla.

## Roles y navegacion

| Rol             | Pestanas                                          |
|-----------------|---------------------------------------------------|
| Administrador   | Panel, Agenda, Pacientes, Chat, Perfil            |
| Recepcionista   | Agenda, Pacientes, Pagos, Chat, Perfil            |
| Medico          | Agenda, Pacientes, Chat, Perfil                   |
| Paciente        | Mis citas, Mis examenes, Perfil                   |

El rol llega en la respuesta del login y se normaliza en `src/modelos.js`
(`normRol`), de modo que "Medico", "MEDICO" y "Médico" se tratan igual. Las
pestanas se ocultan con `href: null` segun el rol.

## Endpoints consumidos

| Pantalla                   | Endpoints                                                        |
|----------------------------|------------------------------------------------------------------|
| Login                      | `POST /api/auth/login`                                           |
| Panel (admin)              | `GET /api/dashboard/stats?fecha=`                                |
| Agenda                     | `GET /api/citas`, `/citas/hoy`, `/citas/fecha/:f`, `/citas/medico/:id`, `/citas/paciente/:id`, `PUT /api/citas/:id`, `DELETE /api/citas/:id` |
| Nueva cita                 | `POST /api/citas`, `GET /api/medicos`, `GET /api/especialidades`, `GET /api/pacientes/buscar/:term` |
| Registrar consulta         | `POST /api/consultas`                                            |
| Ficha del paciente         | `GET /api/pacientes/:id`, `GET /api/consultas/paciente/:id`, `GET /api/examenes/paciente/:id` |
| Pacientes                  | `GET /api/pacientes`, `GET /api/pacientes/buscar/:term`          |
| Pagos                      | `GET /api/pagos`, `PUT /api/pagos/:id`                           |
| Reporte de pagos           | `GET /api/pagos/reporte?inicio=&fin=`                            |
| Examenes                   | `GET /api/examenes/paciente/:id`, `GET /api/examenes/:id`, `POST /api/examenes/upload`, `POST /api/examenes/:id/generar-resumen`, `GET /api/examenes/:id/archivo` |
| Chat                       | `GET /api/chat/usuarios`, `GET|POST /api/chat/conversaciones`, `GET /api/chat/conversaciones/:id/mensajes` + Socket.IO |
| Admin medicos              | `GET|POST /api/medicos`, `DELETE /api/medicos/:id`               |
| Admin especialidades       | `GET|POST|DELETE /api/especialidades`                            |

## Comportamientos del backend que la app respeta

- **JWT de 10 horas.** Se guarda en AsyncStorage junto con los datos de sesion.
  Como no hay endpoint de perfil, la sesion se reconstruye desde el dispositivo.
  Ante un `401` la app cierra sesion sola (`alExpirarSesion` en `src/api.js`).
- **Rate limiting del login:** 10 intentos por 15 minutos. El `429` se traduce a
  un mensaje claro para el usuario.
- **Reprogramacion automatica de citas.** Si el medico ya tiene una cita dentro
  de los 30 minutos siguientes, el servidor desplaza la nueva y responde
  `Ajustado: true`; la pantalla de alta avisa del cambio de horario.
- **Estados de cita:** Pendiente, En Espera, Atendida, Cancelada, Reprogramada.
  El paciente solo puede cancelar; el medico y recepcion cambian el resto.
- **Consulta transaccional.** `POST /api/consultas` recibe en una sola llamada la
  consulta, los signos vitales y el arreglo de recetas.
- **Examenes con OCR + IA.** Tras la carga, el procesamiento ocurre en segundo
  plano; por eso la pantalla muestra "resumen en proceso" hasta que existe.
  Al paciente se le muestra `Resumen_Paciente` y al medico `Resumen_Medico`.
- **Examenes sensibles.** La app avisa que el acceso queda auditado con IP.
- **Chat Socket.IO.** El handshake se autentica con el mismo JWT. La app emite
  `mensaje:enviar`, `conversacion:abrir` y `conversacion:salir`, y escucha
  `mensaje:nuevo`, `mensaje:leido`, `usuario:estado` y `conversacion:nueva`.

## Sobre los nombres de campos

El backend devuelve columnas de PostgreSQL (`ID_Paciente`, `Nombres`,
`Fecha_Hora`) y, segun el endpoint, alias como `nombre_paciente`. Para no atar
las pantallas a una variante concreta, todas las respuestas pasan por los
normalizadores de `src/modelos.js`. Si algun campo llega distinto de lo
esperado, **se corrige unicamente ahi**, sin tocar las pantallas.

## Estructura

    app/
      _layout.jsx            sesion + guardia de navegacion
      login.jsx
      (app)/                 pestanas: inicio, agenda, pacientes, pagos, examenes, chat, perfil
      cita/nueva.jsx
      consulta/[idCita].jsx  consulta + signos vitales + receta
      paciente/[id].jsx      ficha, historial y examenes
      examen/[id].jsx        valores con semaforo y resumenes IA
      examen/subir.jsx       camara / galeria / PDF
      chat/[id].jsx          conversacion en tiempo real
      admin/                 medicos, especialidades, reportes
    src/
      config.js    URL del backend
      api.js       cliente REST
      modelos.js   normalizadores y catalogos de estados
      socket.js    cliente Socket.IO
      auth.jsx     sesion y roles
      ui.jsx       componentes compartidos
      theme.js     colores y estados
      fechas.js    utilidades de fecha y moneda
