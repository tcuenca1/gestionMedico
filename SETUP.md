# Guía de Instalación y Despliegue — SGMP (Sistema de Gestión Médica para Policlínicos)

## Requisitos
- **Node.js** ≥ 20
- **PostgreSQL** (para entorno local) o cuenta en **Railway** (para producción)
- **Git**

---

## 1. Despliegue del Backend en Railway y Base de Datos

1. Crea un proyecto en [Railway](https://railway.app/) y despliega tu servicio de Node.js a partir del repositorio.
2. Añade un servicio de base de datos **PostgreSQL**.
3. Ejecuta el script unificado **`backend/sql/script-completo.sql`** en la base de datos de Railway para crear todas las tablas, relaciones y datos iniciales (incluyendo roles, médicos, pacientes y catálogos).
4. Genera un dominio público personalizado o asegúrate de tener la URL provista por Railway (por ejemplo: `https://gestionmedico-production-550b.up.railway.app`).

---

## 2. Conectar el Frontend (Angular) con Railway

Para que la aplicación web se conecte al backend desplegado en Railway, edita el archivo de entorno de producción:
`frontend/src/environments/environment.prod.ts`

```typescript
export const environment = {
  production: true,
  apiBaseUrl: 'https://gestionmedico-production-550b.up.railway.app/api',
};
```

Para compilar y probar la versión de producción conectada a Railway:
```bash
npm run build --configuration=production
```

---

## 3. Conectar la App Móvil (Expo / React Native) con Railway

La aplicación móvil se encuentra en la carpeta `movil/`. Para conectarla al backend desplegado:

1. Abre el archivo **`movil/app.json`** y configura la URL en la sección `extra`:
   ```json
   "extra": {
     "apiUrl": "https://gestionmedico-production-550b.up.railway.app/api",
     "demo": false
   }
   ```
2. Inicia la app móvil ejecutando:
   ```bash
   cd movil
   npm install
   npx expo start -c
   ```
3. Escanea el código QR generado en la terminal con la aplicación **Expo Go** instalada en tu teléfono móvil (asegúrate de que tu teléfono tenga conexión a internet móvil o Wi-Fi con acceso a Railway).

---

## 4. Credenciales de Acceso al Sistema

Puedes ingresar tanto en la web como en la app móvil con las siguientes cuentas predeterminadas:

| Rol            | Usuario (Correo / DNI) | Contraseña     |
|----------------|------------------------|----------------|
| Administrador  | admin@sgmp.com         | admin123       |
| Recepcionista  | recepcion@sgmp.com     | recepcion123   |
| Médico         | dr.paredes@sgmp.com    | medico123      |
| Médico         | dra.lopez@sgmp.com     | medico123      |
| Paciente       | 1100123456             | paciente123    |
| Paciente       | 1100789012             | paciente123    |

---

## 5. Estructura del Proyecto

```
GestionMedico/
├── backend/
│   ├── src/
│   │   ├── routes/         # Rutas de la API (auth, pacientes, citas, chat, etc.)
│   │   ├── app.js          # Configuración de Express y middlewares
│   │   ├── db.js           # Conexión a PostgreSQL
│   │   └── index.js        # Punto de entrada HTTP y Socket.IO
│   └── sql/
│       └── script-completo.sql # Script SQL unificado (Tablas + Seed)
├── frontend/               # Aplicación Web (Angular Standalone)
│   └── src/environments/   # Entornos de configuración (prod / dev)
├── movil/                  # Aplicación Móvil (React Native + Expo Router)
│   └── app.json            # Configuración y apiUrl de Railway
└── SETUP.md
```
