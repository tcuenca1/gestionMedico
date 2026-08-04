/**
 * MODO DEMO
 *
 * Responde las peticiones de la app sin servidor, imitando el contrato real
 * del backend de GestionMedico: mismos nombres de columna (ID_Paciente,
 * Nombres, Fecha_Hora, Estado...), mismos codigos de error y mismas reglas
 * de negocio (conflicto de citas con reprogramacion automatica, estados
 * validos, resumenes de examen en dos versiones).
 *
 * Sirve para dos cosas:
 *   1. Presentar y navegar la app sin depender de PostgreSQL.
 *   2. Documentar, en codigo, la forma exacta que se espera del backend.
 *
 * Se activa desde app.json -> expo.extra.demo = true
 */

// --------------------------------------------------------------- utilidades
function dia(desplazamiento) {
  const d = new Date();
  d.setDate(d.getDate() + desplazamiento);
  return d.toISOString().slice(0, 10);
}

function marca(desplazamiento, hora) {
  return dia(desplazamiento) + 'T' + hora + ':00';
}

function clonar(valor) {
  return JSON.parse(JSON.stringify(valor));
}

// ------------------------------------------------------------------- datos
const especialidades = [
  { ID_Especialidad: 1, Nombre: 'Medicina General' },
  { ID_Especialidad: 2, Nombre: 'Cardiologia' },
  { ID_Especialidad: 3, Nombre: 'Pediatria' },
  { ID_Especialidad: 4, Nombre: 'Dermatologia' },
  { ID_Especialidad: 5, Nombre: 'Ginecologia' },
  { ID_Especialidad: 6, Nombre: 'Traumatologia' },
  { ID_Especialidad: 7, Nombre: 'Neurologia' },
  { ID_Especialidad: 8, Nombre: 'Oftalmologia' }
];

const medicos = [
  { ID_Medico: 1, Nombres: 'Laura', Apellidos: 'Mendoza', Colegiatura: 'CMP-10021', Telefono: '0991112233', ID_Especialidad: 1, especialidad: 'Medicina General' },
  { ID_Medico: 2, Nombres: 'Carlos', Apellidos: 'Rivas', Colegiatura: 'CMP-10044', Telefono: '0992223344', ID_Especialidad: 2, especialidad: 'Cardiologia' },
  { ID_Medico: 3, Nombres: 'Ana', Apellidos: 'Gutierrez', Colegiatura: 'CMP-10098', Telefono: '0993334455', ID_Especialidad: 3, especialidad: 'Pediatria' },
  { ID_Medico: 4, Nombres: 'Diego', Apellidos: 'Salazar', Colegiatura: 'CMP-10112', Telefono: '0994445566', ID_Especialidad: 4, especialidad: 'Dermatologia' },
  { ID_Medico: 5, Nombres: 'Marta', Apellidos: 'Ocampo', Colegiatura: 'CMP-10133', Telefono: '0995556677', ID_Especialidad: 5, especialidad: 'Ginecologia' }
];

const pacientes = [
  { ID_Paciente: 1, Nombres: 'Sebastian', Apellidos: 'Torres', DNI: '0102030405', Telefono: '0987654321', Correo: 'sebastian@correo.com', Direccion: 'Av. Amazonas y Naciones Unidas', Fecha_Nacimiento: '2001-03-14', Sexo: 'M' },
  { ID_Paciente: 2, Nombres: 'Valentina', Apellidos: 'Ruiz', DNI: '0203040506', Telefono: '0986543210', Correo: 'valentina@correo.com', Direccion: 'Calle Rocafuerte 452', Fecha_Nacimiento: '1995-07-22', Sexo: 'F' },
  { ID_Paciente: 3, Nombres: 'Andres', Apellidos: 'Pineda', DNI: '0304050607', Telefono: '0985432109', Correo: 'andres@correo.com', Direccion: 'Av. 10 de Agosto 118', Fecha_Nacimiento: '1988-11-02', Sexo: 'M' },
  { ID_Paciente: 4, Nombres: 'Camila', Apellidos: 'Vera', DNI: '0405060708', Telefono: '0984321098', Correo: 'camila@correo.com', Direccion: 'Los Shyris 900', Fecha_Nacimiento: '2010-05-30', Sexo: 'F' },
  { ID_Paciente: 5, Nombres: 'Jorge', Apellidos: 'Molina', DNI: '0506070809', Telefono: '0983210987', Correo: 'jorge@correo.com', Direccion: 'Manuel Larrea 77', Fecha_Nacimiento: '1972-01-19', Sexo: 'M' },
  { ID_Paciente: 6, Nombres: 'Daniela', Apellidos: 'Cruz', DNI: '0607080910', Telefono: '0982109876', Correo: 'daniela@correo.com', Direccion: 'Av. Colon 1204', Fecha_Nacimiento: '1999-09-09', Sexo: 'F' }
];

const usuarios = [
  { ID_Usuario: 1, Username: 'admin', Correo: 'admin@sgcm.com', password: 'admin123', rol: 'Administrador', nombreCompleto: 'Administrador del Sistema' },
  { ID_Usuario: 2, Username: 'recepcion', Correo: 'recepcion@sgcm.com', password: 'recepcion123', rol: 'Recepcionista', nombreCompleto: 'Patricia Lopez' },
  { ID_Usuario: 3, Username: 'medico', Correo: 'medico@sgcm.com', password: 'medico123', rol: 'Medico', nombreCompleto: 'Dra. Laura Mendoza', idMedico: 1 },
  { ID_Usuario: 4, Username: 'paciente', Correo: 'paciente@sgcm.com', password: 'paciente123', rol: 'Paciente', nombreCompleto: 'Sebastian Torres', idPaciente: 1 }
];

let citas = [
  { ID_Cita: 1, ID_Paciente: 1, ID_Medico: 1, Fecha_Hora: marca(0, '09:00'), Estado: 'Pendiente', Motivo: 'Control general', nombre_paciente: 'Sebastian Torres', nombre_medico: 'Laura Mendoza', especialidad: 'Medicina General' },
  { ID_Cita: 2, ID_Paciente: 2, ID_Medico: 1, Fecha_Hora: marca(0, '09:30'), Estado: 'En Espera', Motivo: 'Cefalea recurrente', nombre_paciente: 'Valentina Ruiz', nombre_medico: 'Laura Mendoza', especialidad: 'Medicina General' },
  { ID_Cita: 3, ID_Paciente: 3, ID_Medico: 2, Fecha_Hora: marca(0, '11:00'), Estado: 'Pendiente', Motivo: 'Dolor toracico al esfuerzo', nombre_paciente: 'Andres Pineda', nombre_medico: 'Carlos Rivas', especialidad: 'Cardiologia' },
  { ID_Cita: 4, ID_Paciente: 1, ID_Medico: 2, Fecha_Hora: marca(3, '10:30'), Estado: 'Pendiente', Motivo: 'Chequeo cardiovascular', nombre_paciente: 'Sebastian Torres', nombre_medico: 'Carlos Rivas', especialidad: 'Cardiologia' },
  { ID_Cita: 5, ID_Paciente: 4, ID_Medico: 3, Fecha_Hora: marca(1, '08:30'), Estado: 'Pendiente', Motivo: 'Control de crecimiento', nombre_paciente: 'Camila Vera', nombre_medico: 'Ana Gutierrez', especialidad: 'Pediatria' },
  { ID_Cita: 6, ID_Paciente: 5, ID_Medico: 1, Fecha_Hora: marca(-7, '08:00'), Estado: 'Atendida', Motivo: 'Hipertension - control', ID_Consulta: 2, nombre_paciente: 'Jorge Molina', nombre_medico: 'Laura Mendoza', especialidad: 'Medicina General' },
  { ID_Cita: 7, ID_Paciente: 1, ID_Medico: 1, Fecha_Hora: marca(-30, '10:00'), Estado: 'Atendida', Motivo: 'Fiebre y malestar', ID_Consulta: 1, nombre_paciente: 'Sebastian Torres', nombre_medico: 'Laura Mendoza', especialidad: 'Medicina General' },
  { ID_Cita: 8, ID_Paciente: 6, ID_Medico: 5, Fecha_Hora: marca(-2, '16:00'), Estado: 'Cancelada', Motivo: 'Control anual', nombre_paciente: 'Daniela Cruz', nombre_medico: 'Marta Ocampo', especialidad: 'Ginecologia' }
];

let consultas = [
  {
    ID_Consulta: 1, ID_Cita: 7, ID_Paciente: 1, ID_Medico: 1, Fecha: dia(-30),
    Motivo: 'Fiebre y malestar general', Sintomas: 'Fiebre de 38.5, cefalea, dolor muscular',
    Diagnostico: 'Sindrome viral agudo',
    Tratamiento: 'Paracetamol 500 mg cada 8 h por 3 dias. Hidratacion abundante y reposo.',
    Observaciones: 'Control si la fiebre persiste mas de 72 horas.',
    nombre_medico: 'Laura Mendoza',
    signos_vitales: { Presion_Arterial: '118/76', Frecuencia_Cardiaca: 92, Temperatura: 38.5, Frecuencia_Respiratoria: 18, Peso: 72.4, Estatura: 1.75, Saturacion_Oxigeno: 97 },
    recetas: [
      { ID_Receta: 1, Medicamento: 'Paracetamol 500 mg', Dosis: '1 tableta', Frecuencia: 'Cada 8 horas', Duracion: '3 dias' },
      { ID_Receta: 2, Medicamento: 'Suero oral', Dosis: '1 sobre', Frecuencia: 'Cada 12 horas', Duracion: '2 dias' }
    ]
  },
  {
    ID_Consulta: 2, ID_Cita: 6, ID_Paciente: 5, ID_Medico: 1, Fecha: dia(-7),
    Motivo: 'Control de hipertension', Sintomas: 'Asintomatico',
    Diagnostico: 'Hipertension arterial esencial controlada',
    Tratamiento: 'Continuar Losartan 50 mg diario. Dieta hiposodica.',
    Observaciones: 'Proximo control en 3 meses.',
    nombre_medico: 'Laura Mendoza',
    signos_vitales: { Presion_Arterial: '132/84', Frecuencia_Cardiaca: 74, Temperatura: 36.6, Frecuencia_Respiratoria: 16, Peso: 88.1, Estatura: 1.7, Saturacion_Oxigeno: 98 },
    recetas: [{ ID_Receta: 3, Medicamento: 'Losartan 50 mg', Dosis: '1 tableta', Frecuencia: 'Cada 24 horas', Duracion: 'Permanente' }]
  },
  {
    ID_Consulta: 3, ID_Cita: null, ID_Paciente: 1, ID_Medico: 2, Fecha: dia(-120),
    Motivo: 'Chequeo cardiovascular preventivo', Sintomas: 'Ninguno',
    Diagnostico: 'Sin hallazgos patologicos',
    Tratamiento: 'Actividad fisica aerobica 150 minutos por semana.',
    Observaciones: 'Electrocardiograma dentro de parametros normales.',
    nombre_medico: 'Carlos Rivas',
    signos_vitales: { Presion_Arterial: '115/72', Frecuencia_Cardiaca: 66, Temperatura: 36.4, Frecuencia_Respiratoria: 15, Peso: 71.8, Estatura: 1.75, Saturacion_Oxigeno: 99 },
    recetas: []
  }
];

let examenes = [
  {
    ID_Examen: 1, ID_Paciente: 1, Nombre_Archivo: 'biometria_hematica.pdf', Tipo: 'Sangre',
    Laboratorio: 'Laboratorio Clinico Central', Fecha: dia(-28), Estado: 'borderline', Es_Sensible: false,
    Resumen_Medico: 'Biometria hematica con leucocitosis leve (11.8 x10^3/uL) de predominio neutrofilico, compatible con proceso infeccioso en resolucion. Hemoglobina y plaquetas dentro de rango. Se sugiere control en 2 semanas.',
    Resumen_Paciente: 'Tus defensas estan un poco mas altas de lo normal, algo habitual cuando el cuerpo esta terminando de superar una infeccion. El resto de valores de tu sangre esta bien. Conviene repetir el examen en dos semanas.',
    valores: [
      { ID_Valor: 1, Nombre: 'Hemoglobina', Valor: 14.6, Unidad: 'g/dL', Estado: 'normal', Rango_Referencia: '13.5 - 17.5' },
      { ID_Valor: 2, Nombre: 'Leucocitos', Valor: 11.8, Unidad: 'x10^3/uL', Estado: 'alterado', Rango_Referencia: '4.5 - 11.0' },
      { ID_Valor: 3, Nombre: 'Neutrofilos', Valor: 74, Unidad: '%', Estado: 'alterado', Rango_Referencia: '40 - 70' },
      { ID_Valor: 4, Nombre: 'Plaquetas', Valor: 265, Unidad: 'x10^3/uL', Estado: 'normal', Rango_Referencia: '150 - 400' }
    ]
  },
  {
    ID_Examen: 2, ID_Paciente: 1, Nombre_Archivo: 'perfil_lipidico.pdf', Tipo: 'Perfil Lipidico',
    Laboratorio: 'Laboratorio Clinico Central', Fecha: dia(-118), Estado: 'normal', Es_Sensible: false,
    Resumen_Medico: 'Perfil lipidico completo dentro de parametros. Colesterol total 178 mg/dL, LDL 102 mg/dL, HDL 54 mg/dL, trigliceridos 110 mg/dL. Riesgo cardiovascular bajo.',
    Resumen_Paciente: 'Tus grasas en la sangre estan en niveles saludables. El colesterol bueno esta adecuado y el malo dentro de lo esperado. Mantener la alimentacion y el ejercicio.',
    valores: [
      { ID_Valor: 5, Nombre: 'Colesterol total', Valor: 178, Unidad: 'mg/dL', Estado: 'normal', Rango_Referencia: '< 200' },
      { ID_Valor: 6, Nombre: 'Colesterol LDL', Valor: 102, Unidad: 'mg/dL', Estado: 'normal', Rango_Referencia: '< 130' },
      { ID_Valor: 7, Nombre: 'Colesterol HDL', Valor: 54, Unidad: 'mg/dL', Estado: 'normal', Rango_Referencia: '> 40' },
      { ID_Valor: 8, Nombre: 'Trigliceridos', Valor: 110, Unidad: 'mg/dL', Estado: 'normal', Rango_Referencia: '< 150' }
    ]
  },
  {
    ID_Examen: 3, ID_Paciente: 5, Nombre_Archivo: 'funcion_renal.pdf', Tipo: 'Funcion Renal',
    Laboratorio: 'Laboratorio Metropolitano', Fecha: dia(-6), Estado: 'critico', Es_Sensible: true,
    Resumen_Medico: 'Creatinina 2.1 mg/dL con tasa de filtracion glomerular estimada de 38 mL/min/1.73m2, compatible con enfermedad renal cronica estadio 3b. Urea elevada. Requiere valoracion por nefrologia y ajuste de dosis de farmacos de eliminacion renal.',
    Resumen_Paciente: 'Los resultados muestran que tus rinones estan trabajando por debajo de lo esperado. Es importante que converses pronto con tu medico, porque puede ser necesario ajustar tus medicinas y pedir una valoracion con un especialista.',
    valores: [
      { ID_Valor: 9, Nombre: 'Creatinina', Valor: 2.1, Unidad: 'mg/dL', Estado: 'critico', Rango_Referencia: '0.7 - 1.3' },
      { ID_Valor: 10, Nombre: 'Urea', Valor: 68, Unidad: 'mg/dL', Estado: 'alterado', Rango_Referencia: '15 - 45' },
      { ID_Valor: 11, Nombre: 'Tasa de filtracion glomerular', Valor: 38, Unidad: 'mL/min', Estado: 'critico', Rango_Referencia: '> 90' }
    ]
  }
];

let pagos = [
  { ID_Pago: 1, ID_Consulta: 1, ID_Cita: 7, Monto: 35, Metodo: 'Efectivo', Estado: 'Completado', Fecha: dia(-30), nombre_paciente: 'Sebastian Torres' },
  { ID_Pago: 2, ID_Consulta: 2, ID_Cita: 6, Monto: 40, Metodo: 'Tarjeta', Estado: 'Completado', Fecha: dia(-7), nombre_paciente: 'Jorge Molina' },
  { ID_Pago: 3, ID_Consulta: 3, ID_Cita: null, Monto: 60, Metodo: 'Transferencia', Estado: 'Pendiente', Fecha: dia(-1), nombre_paciente: 'Sebastian Torres' },
  { ID_Pago: 4, ID_Consulta: 4, ID_Cita: null, Monto: 25, Metodo: 'Efectivo', Estado: 'Anulado', Fecha: dia(-3), nombre_paciente: 'Daniela Cruz' }
];

let conversaciones = [
  { ID_Conversacion: 1, nombre_otro: 'Patricia Lopez (Recepcion)', id_otro_usuario: 2, ultimo_mensaje: 'La paciente de las 9:30 ya esta en sala.', no_leidos: 1 },
  { ID_Conversacion: 2, nombre_otro: 'Dr. Carlos Rivas', id_otro_usuario: 5, ultimo_mensaje: 'Te reenvio el examen del paciente Molina.', no_leidos: 0 }
];

let mensajes = {
  1: [
    { ID_Mensaje: 1, ID_Conversacion: 1, ID_Emisor: 2, Contenido: 'Buenos dias doctora, confirmo la agenda de hoy.', Tipo: 'texto', Fecha: marca(0, '08:05'), Leido: true },
    { ID_Mensaje: 2, ID_Conversacion: 1, ID_Emisor: 3, Contenido: 'Perfecto, gracias Patricia.', Tipo: 'texto', Fecha: marca(0, '08:07'), Leido: true },
    { ID_Mensaje: 3, ID_Conversacion: 1, ID_Emisor: null, Contenido: 'Nueva cita registrada: Valentina Ruiz, hoy 09:30', Tipo: 'sistema', Fecha: marca(0, '08:40'), Leido: true },
    { ID_Mensaje: 4, ID_Conversacion: 1, ID_Emisor: 2, Contenido: 'La paciente de las 9:30 ya esta en sala.', Tipo: 'texto', Fecha: marca(0, '09:22'), Leido: false }
  ],
  2: [
    { ID_Mensaje: 5, ID_Conversacion: 2, ID_Emisor: 5, Contenido: 'Te reenvio el examen del paciente Molina.', Tipo: 'texto', Fecha: marca(-1, '17:10'), Leido: true }
  ]
};

const usuariosChat = [
  { ID_Usuario: 1, Username: 'admin', nombreCompleto: 'Administrador del Sistema', rol: 'Administrador' },
  { ID_Usuario: 2, Username: 'recepcion', nombreCompleto: 'Patricia Lopez', rol: 'Recepcionista' },
  { ID_Usuario: 3, Username: 'medico', nombreCompleto: 'Dra. Laura Mendoza', rol: 'Medico' },
  { ID_Usuario: 5, Username: 'crivas', nombreCompleto: 'Dr. Carlos Rivas', rol: 'Medico' }
];

// ------------------------------------------------------- estado de la sesion
let sesionActual = null;
let siguienteId = 100;

export function usuarioDemoActual() {
  return sesionActual;
}

// ----------------------------------------------------------------- helpers
class ErrorDemo extends Error {
  constructor(mensaje, estado) {
    super(mensaje);
    this.estado = estado || 400;
  }
}

function citaExpandida(c) {
  const p = pacientes.find((x) => x.ID_Paciente === c.ID_Paciente);
  const m = medicos.find((x) => x.ID_Medico === c.ID_Medico);
  return {
    ...c,
    nombre_paciente: p ? p.Nombres + ' ' + p.Apellidos : c.nombre_paciente,
    nombre_medico: m ? m.Nombres + ' ' + m.Apellidos : c.nombre_medico,
    especialidad: m ? m.especialidad : c.especialidad
  };
}

function minutos(fechaHora) {
  return new Date(fechaHora).getTime() / 60000;
}

// --------------------------------------------------------------- enrutador
/**
 * Imita a fetch(): recibe la ruta relativa a /api y las opciones, y devuelve
 * el cuerpo ya parseado. Lanza ErrorDemo con el mismo texto que usaria el
 * backend real.
 */
export async function responderDemo(ruta, opciones = {}) {
  await new Promise((r) => setTimeout(r, 220)); // latencia simulada

  const metodo = (opciones.method || 'GET').toUpperCase();
  const [camino, consulta] = ruta.split('?');
  const partes = camino.split('/').filter(Boolean);
  const params = new Map(
    (consulta || '').split('&').filter(Boolean).map((p) => {
      const [k, v] = p.split('=');
      return [k, decodeURIComponent(v || '')];
    })
  );
  const cuerpo =
    opciones.body && typeof opciones.body === 'string' ? JSON.parse(opciones.body) : {};

  // ------------------------------------------------------------------ auth
  if (partes[0] === 'auth' && partes[1] === 'login') {
    const credencial = String(cuerpo.username || cuerpo.correo || '').toLowerCase();
    const u = usuarios.find(
      (x) => x.Username.toLowerCase() === credencial || x.Correo.toLowerCase() === credencial
    );
    if (!u || u.password !== cuerpo.password) {
      throw new ErrorDemo('Credenciales incorrectas', 401);
    }
    sesionActual = u;
    return {
      token: 'demo.' + u.ID_Usuario + '.' + Date.now(),
      usuario: { ID_Usuario: u.ID_Usuario, Username: u.Username, Correo: u.Correo, Estado_Activo: true },
      rol: u.rol,
      nombreCompleto: u.nombreCompleto,
      idMedico: u.idMedico ?? null,
      idPaciente: u.idPaciente ?? null
    };
  }

  // --------------------------------------------------------------- medicos
  if (partes[0] === 'medicos') {
    if (metodo === 'GET' && partes.length === 1) return clonar(medicos);
    if (metodo === 'GET' && partes.length === 2) {
      const m = medicos.find((x) => x.ID_Medico === Number(partes[1]));
      if (!m) throw new ErrorDemo('Medico no encontrado', 404);
      return clonar(m);
    }
    if (metodo === 'POST') {
      const esp = especialidades.find((e) => e.ID_Especialidad === Number(cuerpo.ID_Especialidad));
      const nuevo = {
        ID_Medico: ++siguienteId,
        Nombres: cuerpo.Nombres,
        Apellidos: cuerpo.Apellidos,
        Colegiatura: cuerpo.Colegiatura || '',
        Telefono: cuerpo.Telefono || '',
        ID_Especialidad: Number(cuerpo.ID_Especialidad),
        especialidad: esp ? esp.Nombre : ''
      };
      medicos.push(nuevo);
      return clonar(nuevo);
    }
    if (metodo === 'DELETE') {
      const i = medicos.findIndex((x) => x.ID_Medico === Number(partes[1]));
      if (i === -1) throw new ErrorDemo('Medico no encontrado', 404);
      medicos.splice(i, 1);
      return null;
    }
  }

  // -------------------------------------------------------- especialidades
  if (partes[0] === 'especialidades') {
    if (metodo === 'GET') return clonar(especialidades);
    if (metodo === 'POST') {
      const nueva = { ID_Especialidad: ++siguienteId, Nombre: cuerpo.Nombre || cuerpo.nombre };
      especialidades.push(nueva);
      return clonar(nueva);
    }
    if (metodo === 'DELETE') {
      const id = Number(partes[1]);
      if (medicos.some((m) => m.ID_Especialidad === id)) {
        throw new ErrorDemo('No se puede eliminar: tiene medicos asociados', 409);
      }
      const i = especialidades.findIndex((e) => e.ID_Especialidad === id);
      if (i === -1) throw new ErrorDemo('Especialidad no encontrada', 404);
      especialidades.splice(i, 1);
      return null;
    }
  }

  // -------------------------------------------------------------- pacientes
  if (partes[0] === 'pacientes') {
    if (metodo === 'GET' && partes.length === 1) return clonar(pacientes);
    if (metodo === 'GET' && partes[1] === 'buscar') {
      const t = String(partes[2] || '').toLowerCase();
      return clonar(
        pacientes
          .filter((p) =>
            (p.Nombres + ' ' + p.Apellidos + ' ' + p.DNI + ' ' + p.ID_Paciente).toLowerCase().includes(t)
          )
          .slice(0, 20)
      );
    }
    if (metodo === 'GET' && partes.length === 2) {
      const p = pacientes.find((x) => x.ID_Paciente === Number(partes[1]));
      if (!p) throw new ErrorDemo('Paciente no encontrado', 404);
      return clonar(p);
    }
    if (metodo === 'PUT') {
      const p = pacientes.find((x) => x.ID_Paciente === Number(partes[1]));
      if (!p) throw new ErrorDemo('Paciente no encontrado', 404);
      Object.assign(p, cuerpo);
      return clonar(p);
    }
  }

  // ------------------------------------------------------------------ citas
  if (partes[0] === 'citas') {
    if (metodo === 'GET' && partes.length === 1) return clonar(citas.map(citaExpandida));
    if (metodo === 'GET' && partes[1] === 'hoy') {
      const hoy = dia(0);
      return clonar(citas.filter((c) => c.Fecha_Hora.slice(0, 10) === hoy).map(citaExpandida));
    }
    if (metodo === 'GET' && partes[1] === 'fecha') {
      return clonar(citas.filter((c) => c.Fecha_Hora.slice(0, 10) === partes[2]).map(citaExpandida));
    }
    if (metodo === 'GET' && partes[1] === 'medico') {
      return clonar(citas.filter((c) => c.ID_Medico === Number(partes[2])).map(citaExpandida));
    }
    if (metodo === 'GET' && partes[1] === 'paciente') {
      return clonar(citas.filter((c) => c.ID_Paciente === Number(partes[2])).map(citaExpandida));
    }
    if (metodo === 'POST') {
      // Regla real del backend: si hay otra cita del mismo medico dentro de
      // los 30 min siguientes, se reprograma +30 min (hasta 10 intentos).
      let fechaHora = cuerpo.Fecha_Hora;
      let ajustado = false;
      for (let intento = 0; intento < 10; intento++) {
        const choque = citas.some(
          (c) =>
            c.ID_Medico === Number(cuerpo.ID_Medico) &&
            c.Estado !== 'Cancelada' &&
            Math.abs(minutos(c.Fecha_Hora) - minutos(fechaHora)) < 30
        );
        if (!choque) break;
        const d = new Date(fechaHora);
        d.setMinutes(d.getMinutes() + 30);
        fechaHora = d.toISOString().slice(0, 19);
        ajustado = true;
      }
      const nueva = {
        ID_Cita: ++siguienteId,
        ID_Paciente: Number(cuerpo.ID_Paciente),
        ID_Medico: Number(cuerpo.ID_Medico),
        Fecha_Hora: fechaHora,
        Estado: 'Pendiente',
        Motivo: cuerpo.Motivo || ''
      };
      citas.push(nueva);
      return { ...citaExpandida(nueva), Ajustado: ajustado };
    }
    if (metodo === 'PUT') {
      const c = citas.find((x) => x.ID_Cita === Number(partes[1]));
      if (!c) throw new ErrorDemo('Cita no encontrada', 404);
      if (cuerpo.Estado) c.Estado = cuerpo.Estado;
      if (cuerpo.Fecha_Hora) c.Fecha_Hora = cuerpo.Fecha_Hora;
      return clonar(citaExpandida(c));
    }
    if (metodo === 'DELETE') {
      const c = citas.find((x) => x.ID_Cita === Number(partes[1]));
      if (!c) throw new ErrorDemo('Cita no encontrada', 404);
      c.Estado = 'Cancelada';
      return null;
    }
  }

  // -------------------------------------------------------------- consultas
  if (partes[0] === 'consultas') {
    if (metodo === 'GET' && partes[1] === 'paciente') {
      const id = Number(partes[2]);
      let lista = consultas.filter((c) => c.ID_Paciente === id);
      if (params.get('desde')) lista = lista.filter((c) => c.Fecha >= params.get('desde'));
      if (params.get('hasta')) lista = lista.filter((c) => c.Fecha <= params.get('hasta'));
      return clonar(lista.sort((a, b) => b.Fecha.localeCompare(a.Fecha)));
    }
    if (metodo === 'POST') {
      if (!cuerpo.Motivo) throw new ErrorDemo('El motivo es requerido', 400);
      if (!cuerpo.Diagnostico) throw new ErrorDemo('El diagnostico es requerido', 400);
      const medico = medicos.find((m) => m.ID_Medico === Number(cuerpo.ID_Medico));
      const nueva = {
        ID_Consulta: ++siguienteId,
        ID_Cita: cuerpo.ID_Cita ?? null,
        ID_Paciente: Number(cuerpo.ID_Paciente),
        ID_Medico: cuerpo.ID_Medico ?? null,
        Fecha: dia(0),
        Motivo: cuerpo.Motivo,
        Sintomas: cuerpo.Sintomas || '',
        Diagnostico: cuerpo.Diagnostico,
        Tratamiento: cuerpo.Tratamiento || '',
        Observaciones: cuerpo.Observaciones || '',
        nombre_medico: medico ? medico.Nombres + ' ' + medico.Apellidos : '',
        signos_vitales: cuerpo.signos_vitales || {},
        recetas: (cuerpo.recetas || []).map((r, i) => ({ ID_Receta: siguienteId * 10 + i, ...r }))
      };
      consultas.push(nueva);
      const cita = citas.find((c) => c.ID_Cita === Number(cuerpo.ID_Cita));
      if (cita) {
        cita.Estado = 'Atendida';
        cita.ID_Consulta = nueva.ID_Consulta;
      }
      return clonar(nueva);
    }
  }

  // ------------------------------------------------------------------ pagos
  if (partes[0] === 'pagos') {
    if (metodo === 'GET' && partes[1] === 'reporte') {
      const inicio = params.get('inicio') || '0000-00-00';
      const fin = params.get('fin') || '9999-99-99';
      return clonar(pagos.filter((p) => p.Fecha >= inicio && p.Fecha <= fin));
    }
    if (metodo === 'GET') return clonar(pagos);
    if (metodo === 'POST') {
      const nuevo = { ID_Pago: ++siguienteId, Fecha: dia(0), Estado: 'Pendiente', ...cuerpo };
      pagos.push(nuevo);
      return clonar(nuevo);
    }
    if (metodo === 'PUT') {
      const p = pagos.find((x) => x.ID_Pago === Number(partes[1]));
      if (!p) throw new ErrorDemo('Pago no encontrado', 404);
      p.Estado = cuerpo.Estado || p.Estado;
      return clonar(p);
    }
  }

  // -------------------------------------------------------------- dashboard
  if (partes[0] === 'dashboard' && partes[1] === 'stats') {
    const fecha = params.get('fecha') || dia(0);
    const delDia = citas.filter((c) => c.Fecha_Hora.slice(0, 10) === fecha);
    return {
      totalMedicos: medicos.length,
      totalPacientes: pacientes.length,
      totalEspecialidades: especialidades.length,
      citasHoy: delDia.length,
      citasPendientes: delDia.filter((c) => c.Estado === 'Pendiente').length,
      citasAtendidas: delDia.filter((c) => c.Estado === 'Atendida').length,
      ingresosHoy: pagos
        .filter((p) => p.Estado === 'Completado' && p.Fecha === fecha)
        .reduce((s, p) => s + p.Monto, 0)
    };
  }

  // --------------------------------------------------------------- examenes
  if (partes[0] === 'examenes') {
    if (metodo === 'GET' && partes[1] === 'rangos') return [];
    if (metodo === 'GET' && partes[1] === 'paciente') {
      return clonar(examenes.filter((e) => e.ID_Paciente === Number(partes[2])));
    }
    if (metodo === 'GET' && partes.length === 2) {
      const e = examenes.find((x) => x.ID_Examen === Number(partes[1]));
      if (!e) throw new ErrorDemo('Examen no encontrado', 404);
      return clonar(e);
    }
    if (metodo === 'POST' && partes[1] === 'upload') {
      const nuevo = {
        ID_Examen: ++siguienteId,
        ID_Paciente: Number(sesionActual?.idPaciente || 1),
        Nombre_Archivo: 'examen_cargado.jpg',
        Tipo: 'Sin clasificar',
        Laboratorio: '',
        Fecha: dia(0),
        Estado: 'normal',
        Es_Sensible: false,
        Resumen_Medico: '',
        Resumen_Paciente: '',
        valores: []
      };
      examenes.push(nuevo);
      // El backend real procesa OCR e IA en segundo plano: lo imitamos.
      setTimeout(() => {
        nuevo.Tipo = 'Sangre';
        nuevo.Resumen_Medico = 'Procesamiento OCR simulado. Sin valores fuera de rango detectados.';
        nuevo.Resumen_Paciente = 'Tu examen se proceso correctamente y no se detectaron valores fuera de lo normal.';
      }, 6000);
      return clonar(nuevo);
    }
    if (metodo === 'POST' && partes[2] === 'generar-resumen') {
      const e = examenes.find((x) => x.ID_Examen === Number(partes[1]));
      if (!e) throw new ErrorDemo('Examen no encontrado', 404);
      return clonar(e);
    }
    if (metodo === 'DELETE') {
      const i = examenes.findIndex((x) => x.ID_Examen === Number(partes[1]));
      if (i !== -1) examenes.splice(i, 1);
      return null;
    }
  }

  // ------------------------------------------------------------------- chat
  if (partes[0] === 'chat') {
    if (partes[1] === 'usuarios') {
      return clonar(usuariosChat.filter((u) => u.ID_Usuario !== sesionActual?.ID_Usuario));
    }
    if (partes[1] === 'conversaciones' && metodo === 'GET' && partes.length === 2) {
      return clonar(conversaciones);
    }
    if (partes[1] === 'conversaciones' && metodo === 'POST') {
      const idOtro = Number(cuerpo.idUsuario || cuerpo.ID_Usuario);
      let conv = conversaciones.find((c) => c.id_otro_usuario === idOtro);
      if (!conv) {
        const otro = usuariosChat.find((u) => u.ID_Usuario === idOtro);
        conv = {
          ID_Conversacion: ++siguienteId,
          nombre_otro: otro ? otro.nombreCompleto : 'Conversacion',
          id_otro_usuario: idOtro,
          ultimo_mensaje: '',
          no_leidos: 0
        };
        conversaciones.push(conv);
        mensajes[conv.ID_Conversacion] = [];
      }
      return clonar(conv);
    }
    if (partes[1] === 'conversaciones' && partes[3] === 'mensajes') {
      const id = Number(partes[2]);
      const conv = conversaciones.find((c) => c.ID_Conversacion === id);
      if (conv) conv.no_leidos = 0;
      return clonar(mensajes[id] || []);
    }
  }

  throw new ErrorDemo('Ruta no implementada en el modo demo: ' + metodo + ' ' + ruta, 404);
}

/** Usado por el socket simulado para persistir los mensajes enviados. */
export function guardarMensajeDemo(idConversacion, contenido) {
  const id = Number(idConversacion);
  if (!mensajes[id]) mensajes[id] = [];
  const nuevo = {
    ID_Mensaje: ++siguienteId,
    ID_Conversacion: id,
    ID_Emisor: sesionActual?.ID_Usuario ?? null,
    Contenido: contenido,
    Tipo: 'texto',
    Fecha: new Date().toISOString(),
    Leido: false
  };
  mensajes[id].push(nuevo);
  const conv = conversaciones.find((c) => c.ID_Conversacion === id);
  if (conv) conv.ultimo_mensaje = contenido;
  return clonar(nuevo);
}

/** Respuesta automatica para que la conversacion se vea viva en la demo. */
export function respuestaAutomaticaDemo(idConversacion) {
  const id = Number(idConversacion);
  const conv = conversaciones.find((c) => c.ID_Conversacion === id);
  const nuevo = {
    ID_Mensaje: ++siguienteId,
    ID_Conversacion: id,
    ID_Emisor: conv ? conv.id_otro_usuario : 0,
    Contenido: 'Recibido, quedo pendiente.',
    Tipo: 'texto',
    Fecha: new Date().toISOString(),
    Leido: false
  };
  if (!mensajes[id]) mensajes[id] = [];
  mensajes[id].push(nuevo);
  if (conv) conv.ultimo_mensaje = nuevo.Contenido;
  return clonar(nuevo);
}
