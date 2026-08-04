import Constants from 'expo-constants';

/**
 * URL base del backend de GestionMedico (Express + Socket.IO).
 *
 * Prioridad:
 *   1. app.json -> expo.extra.apiUrl   (produccion / servidor desplegado)
 *   2. IP del PC que sirve Expo, puerto 3000 (desarrollo local)
 *
 * El backend del proyecto corre por defecto en el puerto 3000. Si tu servidor
 * usa otro puerto, cambia PUERTO_API o fija apiUrl en app.json.
 */
const PUERTO_API = 3000;

function inferirHost() {
  const host =
    Constants.expoConfig?.hostUri ||
    Constants.expoGoConfig?.debuggerHost ||
    Constants.manifest2?.extra?.expoGo?.debuggerHost ||
    '';
  const ip = String(host).split(':')[0];
  return ip || 'localhost';
}

const configurada = Constants.expoConfig?.extra?.apiUrl;

/**
 * Modo demo: la app responde con datos simulados, sin servidor.
 * Se apaga poniendo "demo": false en app.json -> expo.extra
 */
export const MODO_DEMO = Constants.expoConfig?.extra?.demo === true;

/** Raiz del servidor, sin /api. Socket.IO se conecta aqui. */
export const SERVIDOR_URL =
  configurada && configurada.length
    ? String(configurada).replace(/\/api\/?$/, '')
    : 'http://' + inferirHost() + ':' + PUERTO_API;

/** Raiz de la API REST. */
export const API_URL = SERVIDOR_URL + '/api';
