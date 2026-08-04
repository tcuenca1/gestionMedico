import { io } from 'socket.io-client';
import { MODO_DEMO, SERVIDOR_URL } from './config';
import { leerToken } from './api';
import { guardarMensajeDemo, respuestaAutomaticaDemo } from './demo';

/**
 * Cliente Socket.IO del modulo de chat.
 *
 * El backend autentica el handshake con el mismo JWT del login y maneja salas
 * user_{id} y conv_{id}, ademas de conexiones multiples por usuario.
 *
 * Eventos que emite la app:   mensaje:enviar, conversacion:abrir, conversacion:salir
 * Eventos que escucha:        mensaje:nuevo, mensaje:leido, usuario:estado, conversacion:nueva
 *
 * En modo demo se sustituye por un emisor local que respeta los mismos
 * nombres de evento, de forma que las pantallas no cambian.
 */
let socket = null;

// ---------------------------------------------------------- emisor de demo
const oyentesDemo = new Map();

function difundirDemo(evento, carga) {
  const oyentes = oyentesDemo.get(evento);
  if (oyentes) oyentes.forEach((fn) => fn(carga));
}

const socketDemo = {
  connected: true,
  on(evento, fn) {
    if (!oyentesDemo.has(evento)) oyentesDemo.set(evento, new Set());
    oyentesDemo.get(evento).add(fn);
  },
  off(evento, fn) {
    const oyentes = oyentesDemo.get(evento);
    if (oyentes) oyentes.delete(fn);
  },
  removeAllListeners() {
    oyentesDemo.clear();
  },
  disconnect() {
    oyentesDemo.clear();
  },
  emit(evento, datos) {
    if (evento !== 'mensaje:enviar') return;
    const idConversacion = datos.idConversacion ?? datos.ID_Conversacion;
    const contenido = datos.contenido ?? datos.Contenido;

    difundirDemo('mensaje:nuevo', guardarMensajeDemo(idConversacion, contenido));

    // Respuesta del interlocutor, para que la conversacion se vea viva.
    setTimeout(() => {
      difundirDemo('mensaje:nuevo', respuestaAutomaticaDemo(idConversacion));
    }, 1500);
  }
};

// -------------------------------------------------------------- API publica
export async function conectarSocket() {
  if (MODO_DEMO) {
    socket = socketDemo;
    return socket;
  }
  if (socket && socket.connected) return socket;

  const token = await leerToken();
  if (!token) return null;

  socket = io(SERVIDOR_URL, {
    transports: ['websocket'],
    auth: { token },
    query: { token },
    reconnection: true,
    reconnectionDelay: 1000
  });
  return socket;
}

export function obtenerSocket() {
  return socket;
}

export function desconectarSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

/** Registra un listener y devuelve la funcion para quitarlo. */
export function escuchar(evento, manejador) {
  if (!socket) return () => {};
  socket.on(evento, manejador);
  return () => socket && socket.off(evento, manejador);
}

export function emitir(evento, datos) {
  if (socket) socket.emit(evento, datos);
}
