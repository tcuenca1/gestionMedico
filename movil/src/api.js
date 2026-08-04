import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL, MODO_DEMO } from './config';
import { responderDemo } from './demo';
import {
  normCita, normConsulta, normConversacion, normDashboard, normEspecialidad,
  normExamen, normMedico, normMensaje, normPaciente, normPago
} from './modelos';

const CLAVE_TOKEN = 'sgcm.token';
const CLAVE_SESION = 'sgcm.sesion';

export async function guardarSesion(token, sesion) {
  await AsyncStorage.multiSet([
    [CLAVE_TOKEN, token],
    [CLAVE_SESION, JSON.stringify(sesion || {})]
  ]);
}
export async function leerToken() {
  return AsyncStorage.getItem(CLAVE_TOKEN);
}
export async function leerSesion() {
  const bruto = await AsyncStorage.getItem(CLAVE_SESION);
  return bruto ? JSON.parse(bruto) : null;
}
export async function borrarSesion() {
  await AsyncStorage.multiRemove([CLAVE_TOKEN, CLAVE_SESION]);
}

/** Suscriptores notificados cuando el backend responde 401 (token vencido). */
const oyentesSesionExpirada = new Set();
export function alExpirarSesion(fn) {
  oyentesSesionExpirada.add(fn);
  return () => oyentesSesionExpirada.delete(fn);
}

async function peticion(ruta, opciones = {}) {
  // En modo demo no se sale a la red: responde el simulador local, que imita
  // el mismo contrato del backend real (ver src/demo.js).
  if (MODO_DEMO) return responderDemo(ruta, opciones);

  const token = await leerToken();
  const cabeceras = { Accept: 'application/json', ...(opciones.headers || {}) };
  if (!(opciones.body instanceof FormData)) cabeceras['Content-Type'] = 'application/json';
  if (token) cabeceras.Authorization = 'Bearer ' + token;

  let respuesta;
  try {
    respuesta = await fetch(API_URL + ruta, { ...opciones, headers: cabeceras });
  } catch (e) {
    throw new Error(
      'No se pudo conectar con el servidor (' + API_URL + '). Verifica que el backend este ' +
      'encendido y que el telefono este en la misma red.'
    );
  }

  if (respuesta.status === 401) {
    oyentesSesionExpirada.forEach((fn) => fn());
    throw new Error('Tu sesion expiro. Vuelve a iniciar sesion.');
  }
  if (respuesta.status === 204) return null;

  const texto = await respuesta.text();
  let cuerpo = null;
  try {
    cuerpo = texto ? JSON.parse(texto) : null;
  } catch (e) {
    cuerpo = { error: texto };
  }
  if (!respuesta.ok) {
    const detalle =
      (cuerpo && (cuerpo.error || cuerpo.message || cuerpo.mensaje)) || 'Error ' + respuesta.status;
    if (respuesta.status === 429) {
      throw new Error('Demasiados intentos. El login se bloquea 15 minutos tras 10 fallos.');
    }
    throw new Error(detalle);
  }
  return cuerpo;
}

/** Muchos endpoints devuelven [] o {data:[]} o {rows:[]}; esto lo aplana. */
function lista(respuesta) {
  if (Array.isArray(respuesta)) return respuesta;
  if (!respuesta) return [];
  return respuesta.data || respuesta.rows || respuesta.resultados || [];
}

const json = (metodo, cuerpo) => ({ method: metodo, body: JSON.stringify(cuerpo) });

export const api = {
  // ---------------------------------------------------------------- auth
  async login(usuario, password) {
    const r = await peticion(
      '/auth/login',
      json('POST', { username: usuario, correo: usuario, password })
    );
    return r;
  },

  // ------------------------------------------------------------- medicos
  async medicos() {
    return lista(await peticion('/medicos')).map(normMedico);
  },
  async medico(id) {
    return normMedico(await peticion('/medicos/' + id));
  },
  crearMedico: (datos) => peticion('/medicos', json('POST', datos)),
  actualizarMedico: (id, datos) => peticion('/medicos/' + id, json('PUT', datos)),
  desactivarMedico: (id) => peticion('/medicos/' + id, { method: 'DELETE' }),

  // ------------------------------------------------------- especialidades
  async especialidades() {
    return lista(await peticion('/especialidades')).map(normEspecialidad);
  },
  crearEspecialidad: (nombre) => peticion('/especialidades', json('POST', { Nombre: nombre, nombre })),
  actualizarEspecialidad: (id, nombre) =>
    peticion('/especialidades/' + id, json('PUT', { Nombre: nombre, nombre })),
  eliminarEspecialidad: (id) => peticion('/especialidades/' + id, { method: 'DELETE' }),

  // ------------------------------------------------------------ pacientes
  async pacientes() {
    return lista(await peticion('/pacientes')).map(normPaciente);
  },
  async buscarPacientes(termino) {
    return lista(await peticion('/pacientes/buscar/' + encodeURIComponent(termino))).map(normPaciente);
  },
  async paciente(id) {
    return normPaciente(await peticion('/pacientes/' + id));
  },
  crearPaciente: (datos) => peticion('/pacientes', json('POST', datos)),
  actualizarPaciente: (id, datos) => peticion('/pacientes/' + id, json('PUT', datos)),

  // ---------------------------------------------------------------- citas
  async citas() {
    return lista(await peticion('/citas')).map(normCita);
  },
  async citasHoy() {
    return lista(await peticion('/citas/hoy')).map(normCita);
  },
  async citasPorFecha(fecha) {
    return lista(await peticion('/citas/fecha/' + fecha)).map(normCita);
  },
  async citasDeMedico(idMedico) {
    return lista(await peticion('/citas/medico/' + idMedico)).map(normCita);
  },
  async citasDePaciente(idPaciente) {
    return lista(await peticion('/citas/paciente/' + idPaciente)).map(normCita);
  },
  /** Devuelve la cita creada; si el backend reprograma por conflicto, trae Ajustado: true. */
  async crearCita(datos) {
    const r = await peticion('/citas', json('POST', datos));
    const cita = normCita(r && (r.cita || r.data || r));
    if (cita) cita.ajustado = Boolean((r && (r.Ajustado || r.ajustado)) || cita.ajustado);
    return cita;
  },
  cambiarEstadoCita: (id, estado) =>
    peticion('/citas/' + id, json('PUT', { Estado: estado, estado })),
  cancelarCita: (id) => peticion('/citas/' + id, { method: 'DELETE' }),

  // ------------------------------------------------------------ consultas
  async historial(idPaciente, filtros = {}) {
    const qs = Object.entries(filtros)
      .filter(([, v]) => v)
      .map(([k, v]) => k + '=' + encodeURIComponent(v))
      .join('&');
    const r = await peticion('/consultas/paciente/' + idPaciente + (qs ? '?' + qs : ''));
    return lista(r).map(normConsulta);
  },
  /**
   * Registra consulta + signos vitales + recetas en una sola operacion
   * transaccional, tal como lo expone POST /api/consultas.
   */
  registrarConsulta: (datos) => peticion('/consultas', json('POST', datos)),

  // ---------------------------------------------------------------- pagos
  async pagos() {
    return lista(await peticion('/pagos')).map(normPago);
  },
  async reportePagos(inicio, fin) {
    return lista(await peticion('/pagos/reporte?inicio=' + inicio + '&fin=' + fin)).map(normPago);
  },
  registrarPago: (datos) => peticion('/pagos', json('POST', datos)),
  actualizarPago: (id, estado) => peticion('/pagos/' + id, json('PUT', { Estado: estado, estado })),

  // ------------------------------------------------------------ dashboard
  async estadisticas(fecha) {
    return normDashboard(await peticion('/dashboard/stats' + (fecha ? '?fecha=' + fecha : '')));
  },

  // ------------------------------------------------------------- examenes
  async examenesDePaciente(idPaciente, filtros = {}) {
    const qs = Object.entries(filtros)
      .filter(([, v]) => v)
      .map(([k, v]) => k + '=' + encodeURIComponent(v))
      .join('&');
    const r = await peticion('/examenes/paciente/' + idPaciente + (qs ? '?' + qs : ''));
    return lista(r).map(normExamen);
  },
  async examen(id) {
    return normExamen(await peticion('/examenes/' + id));
  },
  /** archivo: { uri, name, type } tal como lo entrega expo-image-picker. */
  subirExamen(idPaciente, archivo, datos = {}) {
    const form = new FormData();
    form.append('archivo', { uri: archivo.uri, name: archivo.name, type: archivo.type });
    form.append('ID_Paciente', String(idPaciente));
    Object.entries(datos).forEach(([k, v]) => v && form.append(k, String(v)));
    return peticion('/examenes/upload', { method: 'POST', body: form });
  },
  eliminarExamen: (id) => peticion('/examenes/' + id, { method: 'DELETE' }),
  regenerarResumen: (id) => peticion('/examenes/' + id + '/generar-resumen', { method: 'POST' }),
  actualizarValores: (id, valores) => peticion('/examenes/' + id + '/valores', json('PUT', { valores })),
  desbloquearExamen: (id) => peticion('/examenes/' + id + '/desbloquear', { method: 'POST' }),
  logAccesoExamen: (id) => peticion('/examenes/' + id + '/log-acceso'),
  rangosReferencia: () => peticion('/examenes/rangos'),
  /** URL directa del archivo; el backend admite el token por query string. */
  async urlArchivoExamen(id) {
    const token = await leerToken();
    return API_URL + '/examenes/' + id + '/archivo?token=' + encodeURIComponent(token || '');
  },

  // ----------------------------------------------------------------- chat
  async usuariosChat() {
    return lista(await peticion('/chat/usuarios'));
  },
  async conversaciones() {
    return lista(await peticion('/chat/conversaciones')).map(normConversacion);
  },
  async abrirConversacion(idUsuario) {
    const r = await peticion('/chat/conversaciones', json('POST', { idUsuario, ID_Usuario: idUsuario }));
    return normConversacion(r && (r.conversacion || r.data || r));
  },
  async mensajes(idConversacion) {
    const r = await peticion('/chat/conversaciones/' + idConversacion + '/mensajes');
    return lista(r).map(normMensaje);
  }
};
