export const colores = {
  primario: '#0F766E',
  primarioSuave: '#CCFBF1',
  acento: '#0EA5E9',
  fondo: '#F4F6F8',
  tarjeta: '#FFFFFF',
  texto: '#0F172A',
  textoSuave: '#64748B',
  borde: '#E2E8F0',
  peligro: '#DC2626',
  exito: '#16A34A',
  aviso: '#D97706'
};

/** Estados de cita del backend: Pendiente, En Espera, Atendida, Cancelada, Reprogramada */
export const colorEstadoCita = {
  Pendiente: colores.acento,
  'En Espera': colores.aviso,
  Atendida: colores.exito,
  Cancelada: colores.peligro,
  Reprogramada: '#7C3AED'
};

/** Clasificacion de valores de examen: normal, alterado, critico */
export const colorEstadoValor = {
  normal: colores.exito,
  borderline: colores.aviso,
  alterado: colores.aviso,
  critico: colores.peligro
};

export const colorEstadoPago = {
  Pendiente: colores.aviso,
  Completado: colores.exito,
  Anulado: colores.peligro
};

export const esp = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
export const radio = 14;
