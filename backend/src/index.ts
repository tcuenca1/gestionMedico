import app from './app';
import http from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import pool from './db';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const onlineUsers = new Map<number, Set<string>>();

io.use((socket: any, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Token requerido'));
  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err: any, user: any) => {
    if (err) return next(new Error('Token inválido'));
    socket.userId = user.id;
    socket.userRole = user.rol;
    next();
  });
});

io.on('connection', (socket: any) => {
  const userId = socket.userId;
  socket.join(`user_${userId}`);

  if (!onlineUsers.has(userId)) {
    onlineUsers.set(userId, new Set());
  }
  onlineUsers.get(userId)!.add(socket.id);

  if (onlineUsers.get(userId)!.size === 1) {
    io.emit('usuario:estado', { usuario_id: userId, en_linea: true });
  }

  socket.on('mensaje:enviar', async (data: any) => {
    try {
      const { conversacion_id, contenido } = data;
      if (!conversacion_id || !contenido?.trim()) return;

      const check = await pool.query(
        'SELECT * FROM Conversacion WHERE ID_Conversacion = $1 AND (ID_Usuario_1 = $2 OR ID_Usuario_2 = $2)',
        [conversacion_id, userId],
      );
      if (check.rows.length === 0) {
        socket.emit('error', { message: 'No tienes acceso a esta conversación' });
        return;
      }

      const result = await pool.query(
        `INSERT INTO Mensaje (ID_Conversacion, Remitente_ID, Contenido, Tipo)
         VALUES ($1, $2, $3, 'texto') RETURNING *`,
        [conversacion_id, userId, contenido.trim()],
      );

      const msg = result.rows[0];
      const conv = check.rows[0];
      const otroId = conv.id_usuario_1 === userId ? conv.id_usuario_2 : conv.id_usuario_1;

      const payload = {
        id: msg.id_mensaje,
        conversacion_id: msg.id_conversacion,
        remitente_id: msg.remitente_id,
        contenido: msg.contenido,
        tipo: msg.tipo || 'texto',
        leido: msg.leido,
        creado_en: msg.creado_en,
        para_usuario_id: otroId,
      };

      io.to(`conv_${conversacion_id}`).emit('mensaje:nuevo', payload);
      io.to(`user_${otroId}`).emit('mensaje:nuevo', payload);
      io.to(`user_${userId}`).emit('mensaje:nuevo', payload);
    } catch (err) {
      console.error('Error al enviar mensaje:', err);
      socket.emit('error', { message: 'Error al enviar mensaje' });
    }
  });

  socket.on('conversacion:abrir', async (data: any) => {
    try {
      const { conversacion_id } = data;
      if (!conversacion_id) return;

      socket.join(`conv_${conversacion_id}`);

      await pool.query(
        `UPDATE Mensaje SET Leido = true
         WHERE ID_Conversacion = $1 AND Remitente_ID != $2 AND Leido = false`,
        [conversacion_id, userId],
      );

      io.to(`conv_${conversacion_id}`).emit('mensaje:leido', {
        conversacion_id,
        leido_por: userId,
      });
    } catch (err) {
      console.error('Error al abrir conversación:', err);
    }
  });

  socket.on('conversacion:salir', (data: any) => {
    if (data?.conversacion_id) {
      socket.leave(`conv_${data.conversacion_id}`);
    }
  });

  socket.on('disconnect', () => {
    if (onlineUsers.has(userId)) {
      onlineUsers.get(userId)!.delete(socket.id);
      if (onlineUsers.get(userId)!.size === 0) {
        onlineUsers.delete(userId);
        io.emit('usuario:estado', { usuario_id: userId, en_linea: false });
      }
    }
  });
});

app.set('io', io);

server.listen(PORT, () => {
  console.log(`SGMP API (TypeScript) corriendo en http://localhost:${PORT}`);
});
