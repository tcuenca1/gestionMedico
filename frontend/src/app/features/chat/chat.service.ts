import { Injectable, inject, signal } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, tap } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { ChatToastService } from './chat-toast.service';
import { SOCKET_URL, Conversacion, Mensaje } from './types';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private api = inject(ApiService);
  private toast = inject(ChatToastService);
  private socket: Socket | null = null;

  conversaciones = signal<Conversacion[]>([]);
  mensajes = signal<Mensaje[]>([]);
  conversacionActiva = signal<Conversacion | null>(null);
  noLeidos = signal(0);
  panelAbierto = signal(false);
  usuariosDisponibles = signal<{ id: number; nombre: string; rol: string; inicial: string }[]>([]);

  private _estados = signal<Map<number, boolean>>(new Map());
  private _userId: number | null = null;

  conectar(token: string) {
    if (this.socket?.connected) return;

    const raw = localStorage.getItem('currentUser');
    if (raw) {
      try {
        const u = JSON.parse(raw);
        this._userId = u.usuario?.ID_Usuario ?? null;
      } catch { /* ignore */ }
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      this.cargarConversaciones().subscribe();
    });

    this.socket.on('mensaje:nuevo', (msg: Mensaje) => {
      const mapeado: Mensaje = {
        ...msg,
        remitente_nombre:
          msg.remitente_nombre ||
          (msg as any).Remitente_Nombre ||
          (msg as any).usuario_nombre ||
          (msg as any).Usuario_Nombre ||
          (msg as any).Nombre ||
          (msg as any).nombre ||
          (msg as any).Username_Correo ||
          (msg as any).username_correo ||
          null,
      };
      const convActual = this.conversacionActiva();
      const esConvActiva = convActual && mapeado.conversacion_id === convActual.id;

      if (esConvActiva) {
        this.mensajes.update((m) => {
          if (m.some((x) => x.id === mapeado.id)) return m;
          return [...m, mapeado];
        });
        if (mapeado.remitente_id !== null) {
          this.socket?.emit('conversacion:abrir', { conversacion_id: convActual.id });
        }
      } else {
        this.noLeidos.update((n) => n + 1);
        if (mapeado.remitente_id !== null && mapeado.remitente_id !== this._userId) {
          const conv = this.conversaciones().find((c) => c.id === mapeado.conversacion_id);
          if (conv) {
            this.toast.mostrar({
              tipo: 'mensaje',
              titulo: conv.otro_usuario.nombre,
              cuerpo: mapeado.contenido,
              conversacion_id: mapeado.conversacion_id,
            });
          }
        } else if (mapeado.tipo === 'sistema' && (!mapeado.para_usuario_id || mapeado.para_usuario_id === this._userId)) {
          this.toast.mostrar({
            tipo: 'cita',
            titulo: 'Notificación del sistema',
            cuerpo: mapeado.contenido,
            conversacion_id: mapeado.conversacion_id,
          });
        }
      }
      this.cargarConversaciones().subscribe();
    });

    this.socket.on('mensaje:leido', (data: { conversacion_id: number; leido_por: number }) => {
      this.mensajes.update((msgs) =>
        msgs.map((m) =>
          m.remitente_id !== null && m.remitente_id !== data.leido_por
            ? { ...m, leido: true }
            : m,
        ),
      );
    });

    this.socket.on('usuario:estado', (data: { usuario_id: number; en_linea: boolean }) => {
      this._estados.update((map) => {
        map.set(data.usuario_id, data.en_linea);
        return new Map(map);
      });
    });

    this.socket.on('conversacion:nueva', () => {
      this.cargarConversaciones().subscribe();
    });
  }

  desconectar() {
    this.socket?.disconnect();
    this.socket = null;
    this.conversaciones.set([]);
    this.mensajes.set([]);
    this.conversacionActiva.set(null);
    this.noLeidos.set(0);
    this._estados.set(new Map());
    this._userId = null;
  }

  cargarConversaciones(): Observable<Conversacion[]> {
    return this.api.get<Conversacion[]>('/chat/conversaciones').pipe(
      tap((convs) => {
        this.conversaciones.set(convs);
        this.noLeidos.set(convs.reduce((s, c) => s + (c.no_leidos || 0), 0));
      }),
    );
  }

  abrirConversacion(conv: Conversacion) {
    console.log('[Chat] abrirConversacion', conv.id, conv.otro_usuario?.nombre);
    this.conversacionActiva.set(conv);
    this.api.get<any[]>(`/chat/conversaciones/${conv.id}/mensajes`).subscribe({
      next: (msgs) => {
        const mapeados: Mensaje[] = (Array.isArray(msgs) ? msgs : []).map((m) => ({
          ...m,
          remitente_nombre:
            m.remitente_nombre ||
            m.Remitente_Nombre ||
            m.usuario_nombre ||
            m.Usuario_Nombre ||
            m.Nombre ||
            m.nombre ||
            m.Username_Correo ||
            m.username_correo ||
            m.Rol ||
            null,
        }));
        console.log('[Chat] mensajes cargados', mapeados.length);
        this.mensajes.set(mapeados);
        this.socket?.emit('conversacion:abrir', { conversacion_id: conv.id });
        this.cargarConversaciones().subscribe();
      },
      error: (err) => {
        console.error('[Chat] Error al cargar mensajes:', err);
        this.mensajes.set([]);
      },
    });
  }

  cerrarConversacion() {
    const conv = this.conversacionActiva();
    if (conv) this.socket?.emit('conversacion:salir', { conversacion_id: conv.id });
    this.conversacionActiva.set(null);
    this.mensajes.set([]);
  }

  enviarMensaje(conversacionId: number, contenido: string) {
    if (!contenido.trim()) return;
    this.socket?.emit('mensaje:enviar', { conversacion_id: conversacionId, contenido: contenido.trim() });
  }

  crearConversacion(usuarioId: number) {
    return this.api.post<any>('/chat/conversaciones', { usuario_id: usuarioId });
  }

  cargarUsuarios() {
    this.api.get<{ id: number; nombre: string; rol: string; inicial: string }[]>('/chat/usuarios').subscribe({
      next: (users) => this.usuariosDisponibles.set(users),
    });
  }

  togglePanel() {
    this.panelAbierto.update((v) => !v);
    if (this.panelAbierto()) {
      this.cargarConversaciones().subscribe();
      this.cargarUsuarios();
    } else {
      this.cerrarConversacion();
    }
  }

  estaEnLinea(usuarioId: number): boolean {
    return this._estados().get(usuarioId) ?? false;
  }
}
