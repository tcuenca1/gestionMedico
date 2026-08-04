import pool from '../db';

export function emitirNotificacionSistema(io: any, usuarioId: number, titulo: string, cuerpo: string, conversacionId?: number) {
  if (!io) return;
  io.to(`user_${usuarioId}`).emit('mensaje:nuevo', {
    id: Date.now(),
    conversacion_id: conversacionId || null,
    remitente_id: null,
    contenido: `${titulo}: ${cuerpo}`,
    tipo: 'sistema',
    leido: false,
    creado_en: new Date().toISOString(),
    para_usuario_id: usuarioId,
  });
}
