/**
 * Normalizadores.
 *
 * El backend de GestionMedico devuelve las columnas de PostgreSQL tal cual
 * (ID_Paciente, Nombres, Fecha_Hora, ...), pero segun el endpoint aparecen
 * alias distintos (nombre_paciente, medico, etc.). Estas funciones aceptan
 * todas las variantes conocidas y entregan un objeto estable al resto de la
 * app, para que un cambio de alias en el backend se arregle en un solo lugar.
 */

/** Devuelve el primer valor definido y no vacio entre las claves dadas. */
export function campo(obj, ...claves) {
  if (!obj) return undefined;
  for (const c of claves) {
    if (obj[c] !== undefined && obj[c] !== null && obj[c] !== '') return obj[c];
  }
  return undefined;
}

function sinAcentos(texto) {
  return String(texto || '')
    .normalize('NFD')
    // elimina los diacriticos combinantes
    .replace(new RegExp('[' + String.fromCharCode(0x300) + '-' + String.fromCharCode(0x36f) + ']', 'g'), '')
    .toLowerCase()
    .trim();
}

export const ROLES = {
  ADMIN: 'administrador',
  RECEPCION: 'recepcionista',
  MEDICO: 'medico',
  PACIENTE: 'paciente'
};

/** 'Médico', 'MEDICO', 'medico' -> 'medico' */
export function normRol(valor) {
  const r = sinAcentos(valor);
  if (r.startsWith('admin')) return ROLES.ADMIN;
  if (r.startsWith('recep')) return ROLES.RECEPCION;
  if (r.startsWith('medic') || r.startsWith('doctor')) return ROLES.MEDICO;
  if (r.startsWith('pacien')) return ROLES.PACIENTE;
  return r;
}

export const ESTADOS_CITA = ['Pendiente', 'En Espera', 'Atendida', 'Cancelada', 'Reprogramada'];
export const ESTADOS_PAGO = ['Pendiente', 'Completado', 'Anulado'];

export function normUsuario(u, extra = {}) {
  if (!u) return null;
  return {
    id: campo(u, 'ID_Usuario', 'idUsuario', 'id'),
    username: campo(u, 'Username', 'username', 'Usuario'),
    correo: campo(u, 'Correo', 'correo', 'Email', 'email'),
    rol: normRol(campo(u, 'rol', 'Rol', 'Nombre_Rol', 'nombreRol') || extra.rol),
    rolTexto: campo(u, 'rol', 'Rol', 'Nombre_Rol', 'nombreRol') || extra.rol || '',
    nombreCompleto:
      campo(u, 'nombreCompleto', 'nombre_completo', 'NombreCompleto') ||
      extra.nombreCompleto ||
      campo(u, 'Username', 'username') ||
      '',
    idMedico: campo(u, 'idMedico', 'ID_Medico', 'id_medico') ?? extra.idMedico ?? null,
    idPaciente: campo(u, 'idPaciente', 'ID_Paciente', 'id_paciente') ?? extra.idPaciente ?? null,
    activo: campo(u, 'Estado_Activo', 'estadoActivo') !== false
  };
}

export function normPaciente(p) {
  if (!p) return null;
  const nombres = campo(p, 'Nombres', 'nombres', 'nombre') || '';
  const apellidos = campo(p, 'Apellidos', 'apellidos', 'apellido') || '';
  return {
    id: campo(p, 'ID_Paciente', 'idPaciente', 'id'),
    nombres,
    apellidos,
    nombreCompleto: (nombres + ' ' + apellidos).trim() || campo(p, 'nombre_paciente', 'paciente') || '',
    dni: campo(p, 'DNI', 'dni', 'Documento', 'documento') || '',
    telefono: campo(p, 'Telefono', 'telefono') || '',
    correo: campo(p, 'Correo', 'correo', 'email') || '',
    direccion: campo(p, 'Direccion', 'direccion') || '',
    fechaNacimiento: campo(p, 'Fecha_Nacimiento', 'fechaNacimiento', 'fecha_nacimiento') || '',
    sexo: campo(p, 'Sexo', 'sexo') || '',
    idUsuario: campo(p, 'ID_Usuario', 'idUsuario') ?? null,
    crudo: p
  };
}

export function normMedico(m) {
  if (!m) return null;
  const nombres = campo(m, 'Nombres', 'nombres', 'nombre') || '';
  const apellidos = campo(m, 'Apellidos', 'apellidos', 'apellido') || '';
  return {
    id: campo(m, 'ID_Medico', 'idMedico', 'id'),
    nombres,
    apellidos,
    nombreCompleto: (nombres + ' ' + apellidos).trim() || campo(m, 'nombre_medico', 'medico') || '',
    colegiatura: campo(m, 'Colegiatura', 'colegiatura', 'CMP') || '',
    telefono: campo(m, 'Telefono', 'telefono') || '',
    idEspecialidad: campo(m, 'ID_Especialidad', 'idEspecialidad') ?? null,
    especialidad:
      campo(m, 'especialidad', 'Especialidad', 'Nombre_Especialidad', 'nombre_especialidad') || '',
    crudo: m
  };
}

export function normEspecialidad(e) {
  if (!e) return null;
  return {
    id: campo(e, 'ID_Especialidad', 'idEspecialidad', 'id'),
    nombre: campo(e, 'Nombre', 'nombre', 'Nombre_Especialidad', 'especialidad') || ''
  };
}

/** Separa 'Fecha_Hora' (timestamp) o el par Fecha + Hora en {fecha, hora}. */
function separarFechaHora(c) {
  const fechaHora = campo(c, 'Fecha_Hora', 'fechaHora', 'fecha_hora');
  if (fechaHora) {
    const texto = String(fechaHora);
    const iso = texto.includes('T') ? texto : texto.replace(' ', 'T');
    return { fecha: iso.slice(0, 10), hora: iso.slice(11, 16) };
  }
  const fecha = String(campo(c, 'Fecha', 'fecha') || '').slice(0, 10);
  const hora = String(campo(c, 'Hora', 'hora') || '').slice(0, 5);
  return { fecha, hora };
}

export function normCita(c) {
  if (!c) return null;
  const { fecha, hora } = separarFechaHora(c);
  return {
    id: campo(c, 'ID_Cita', 'idCita', 'id'),
    idPaciente: campo(c, 'ID_Paciente', 'idPaciente'),
    idMedico: campo(c, 'ID_Medico', 'idMedico'),
    idConsulta: campo(c, 'ID_Consulta', 'idConsulta') ?? null,
    fecha,
    hora,
    estado: campo(c, 'Estado', 'estado') || 'Pendiente',
    motivo: campo(c, 'Motivo', 'motivo', 'Observaciones') || '',
    paciente:
      campo(c, 'nombre_paciente', 'paciente', 'Paciente') ||
      [campo(c, 'Nombres_Paciente'), campo(c, 'Apellidos_Paciente')].filter(Boolean).join(' '),
    medico:
      campo(c, 'nombre_medico', 'medico', 'Medico') ||
      [campo(c, 'Nombres_Medico'), campo(c, 'Apellidos_Medico')].filter(Boolean).join(' '),
    especialidad: campo(c, 'especialidad', 'Especialidad', 'nombre_especialidad') || '',
    ajustado: campo(c, 'Ajustado', 'ajustado') === true,
    crudo: c
  };
}

export function normSignos(s) {
  if (!s) return null;
  return {
    presion: campo(s, 'Presion_Arterial', 'presionArterial', 'PA') || '',
    frecuenciaCardiaca: campo(s, 'Frecuencia_Cardiaca', 'frecuenciaCardiaca', 'FC') || '',
    frecuenciaRespiratoria: campo(s, 'Frecuencia_Respiratoria', 'frecuenciaRespiratoria', 'FR') || '',
    temperatura: campo(s, 'Temperatura', 'temperatura') || '',
    peso: campo(s, 'Peso', 'peso') || '',
    estatura: campo(s, 'Estatura', 'estatura', 'Talla') || '',
    saturacion: campo(s, 'Saturacion_Oxigeno', 'saturacion', 'SpO2') || ''
  };
}

export function normReceta(r) {
  if (!r) return null;
  return {
    id: campo(r, 'ID_Receta', 'idReceta', 'id'),
    medicamento: campo(r, 'Medicamento', 'medicamento') || '',
    dosis: campo(r, 'Dosis', 'dosis') || '',
    frecuencia: campo(r, 'Frecuencia', 'frecuencia') || '',
    duracion: campo(r, 'Duracion', 'duracion') || ''
  };
}

export function normConsulta(c) {
  if (!c) return null;
  const signos = campo(c, 'signos_vitales', 'signosVitales', 'Signos_Vitales');
  const recetas = campo(c, 'recetas', 'Recetas', 'receta_medicamentos') || [];
  return {
    id: campo(c, 'ID_Consulta', 'idConsulta', 'id'),
    idCita: campo(c, 'ID_Cita', 'idCita') ?? null,
    fecha: String(campo(c, 'Fecha', 'fecha', 'Fecha_Consulta', 'Fecha_Hora') || '').slice(0, 10),
    motivo: campo(c, 'Motivo', 'motivo') || '',
    sintomas: campo(c, 'Sintomas', 'sintomas') || '',
    diagnostico: campo(c, 'Diagnostico', 'diagnostico') || '',
    tratamiento: campo(c, 'Tratamiento', 'tratamiento') || '',
    observaciones: campo(c, 'Observaciones', 'observaciones') || '',
    medico: campo(c, 'nombre_medico', 'medico', 'Medico') || '',
    signos: normSignos(Array.isArray(signos) ? signos[0] : signos),
    recetas: (Array.isArray(recetas) ? recetas : []).map(normReceta),
    crudo: c
  };
}

export function normExamen(e) {
  if (!e) return null;
  return {
    id: campo(e, 'ID_Examen', 'idExamen', 'id'),
    idPaciente: campo(e, 'ID_Paciente', 'idPaciente'),
    nombre: campo(e, 'Nombre_Archivo', 'nombreArchivo', 'Nombre', 'nombre') || 'Examen',
    tipo: campo(e, 'Tipo', 'tipo', 'Tipo_Examen') || 'Sin clasificar',
    laboratorio: campo(e, 'Laboratorio', 'laboratorio') || '',
    fecha: String(campo(e, 'Fecha', 'fecha', 'Fecha_Subida', 'Fecha_Examen') || '').slice(0, 10),
    estado: campo(e, 'Estado', 'estado', 'Estado_General') || 'normal',
    sensible: campo(e, 'Es_Sensible', 'esSensible') === true,
    resumenMedico: campo(e, 'Resumen_Medico', 'resumenMedico') || '',
    resumenPaciente: campo(e, 'Resumen_Paciente', 'resumenPaciente') || '',
    valores: (campo(e, 'valores', 'Valores') || []).map(normValorExamen),
    crudo: e
  };
}

export function normValorExamen(v) {
  if (!v) return null;
  return {
    id: campo(v, 'ID_Valor', 'idValor', 'id'),
    nombre: campo(v, 'Nombre', 'nombre', 'Parametro') || '',
    valor: campo(v, 'Valor', 'valor') ?? '',
    unidad: campo(v, 'Unidad', 'unidad') || '',
    estado: String(campo(v, 'Estado', 'estado', 'Clasificacion') || 'normal').toLowerCase(),
    referencia:
      campo(v, 'Rango_Referencia', 'rangoReferencia', 'referencia') ||
      [campo(v, 'Min', 'minimo'), campo(v, 'Max', 'maximo')].filter((x) => x !== undefined).join(' - ')
  };
}

export function normPago(p) {
  if (!p) return null;
  return {
    id: campo(p, 'ID_Pago', 'idPago', 'id'),
    idConsulta: campo(p, 'ID_Consulta', 'idConsulta'),
    idCita: campo(p, 'ID_Cita', 'idCita') ?? null,
    monto: Number(campo(p, 'Monto', 'monto') || 0),
    metodo: campo(p, 'Metodo', 'metodo', 'Metodo_Pago') || '',
    estado: campo(p, 'Estado', 'estado') || 'Pendiente',
    fecha: String(campo(p, 'Fecha', 'fecha', 'Fecha_Pago') || '').slice(0, 10),
    paciente: campo(p, 'nombre_paciente', 'paciente') || '',
    crudo: p
  };
}

export function normConversacion(c) {
  if (!c) return null;
  return {
    id: campo(c, 'ID_Conversacion', 'idConversacion', 'id'),
    titulo:
      campo(c, 'nombre_otro', 'otroUsuario', 'titulo', 'Titulo', 'nombreCompleto') || 'Conversacion',
    ultimoMensaje: campo(c, 'ultimo_mensaje', 'ultimoMensaje') || '',
    noLeidos: Number(campo(c, 'no_leidos', 'noLeidos', 'unread') || 0),
    idOtroUsuario: campo(c, 'id_otro_usuario', 'idOtroUsuario', 'ID_Usuario') ?? null,
    crudo: c
  };
}

export function normMensaje(m) {
  if (!m) return null;
  return {
    id: campo(m, 'ID_Mensaje', 'idMensaje', 'id'),
    idConversacion: campo(m, 'ID_Conversacion', 'idConversacion'),
    idEmisor: campo(m, 'ID_Emisor', 'idEmisor', 'ID_Usuario', 'idUsuario'),
    texto: campo(m, 'Contenido', 'contenido', 'Texto', 'texto', 'mensaje') || '',
    tipo: String(campo(m, 'Tipo', 'tipo') || 'texto').toLowerCase(),
    fecha: campo(m, 'Fecha', 'fecha', 'Fecha_Envio', 'createdAt') || '',
    leido: campo(m, 'Leido', 'leido') === true,
    crudo: m
  };
}

export function normDashboard(d) {
  const o = d || {};
  return {
    totalMedicos: Number(campo(o, 'totalMedicos', 'total_medicos', 'medicos') || 0),
    totalPacientes: Number(campo(o, 'totalPacientes', 'total_pacientes', 'pacientes') || 0),
    totalEspecialidades: Number(campo(o, 'totalEspecialidades', 'total_especialidades', 'especialidades') || 0),
    citasHoy: Number(campo(o, 'citasHoy', 'citas_hoy', 'totalCitas') || 0),
    citasPendientes: Number(campo(o, 'citasPendientes', 'citas_pendientes', 'pendientes') || 0),
    citasAtendidas: Number(campo(o, 'citasAtendidas', 'citas_atendidas', 'atendidas') || 0),
    ingresosHoy: Number(campo(o, 'ingresosHoy', 'ingresos_hoy', 'ingresos') || 0),
    crudo: o
  };
}
