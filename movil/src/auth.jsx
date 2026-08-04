import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, guardarSesion, borrarSesion, leerSesion, alExpirarSesion } from './api';
import { normRol, normUsuario, ROLES } from './modelos';
import { conectarSocket, desconectarSocket } from './socket';

const Contexto = createContext(null);

export function ProveedorAuth({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    (async () => {
      const sesion = await leerSesion();
      if (sesion && sesion.id) {
        setUsuario(sesion);
        conectarSocket();
      }
      setCargando(false);
    })();
    return alExpirarSesion(() => {
      desconectarSocket();
      borrarSesion();
      setUsuario(null);
    });
  }, []);

  /**
   * El backend responde: { token, usuario, nombreCompleto, rol, idMedico }.
   * Como no hay endpoint /perfil, la sesion se persiste completa en el
   * dispositivo y se reconstruye al abrir la app.
   */
  async function iniciarSesion(credencial, password) {
    const r = await api.login(credencial.trim(), password);
    const token = r.token || r.accessToken;
    if (!token) throw new Error('El servidor no devolvio un token de sesion.');

    const sesion = normUsuario(r.usuario || r.user || {}, {
      rol: r.rol,
      nombreCompleto: r.nombreCompleto,
      idMedico: r.idMedico,
      idPaciente: r.idPaciente
    });
    sesion.rol = normRol(sesion.rolTexto || r.rol);
    await guardarSesion(token, sesion);
    setUsuario(sesion);
    await conectarSocket();
    return sesion;
  }

  async function cerrarSesion() {
    desconectarSocket();
    await borrarSesion();
    setUsuario(null);
  }

  const rol = usuario ? usuario.rol : null;

  return (
    <Contexto.Provider
      value={{
        usuario,
        rol,
        cargando,
        iniciarSesion,
        cerrarSesion,
        esAdmin: rol === ROLES.ADMIN,
        esRecepcion: rol === ROLES.RECEPCION,
        esMedico: rol === ROLES.MEDICO,
        esPaciente: rol === ROLES.PACIENTE
      }}
    >
      {children}
    </Contexto.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error('useAuth debe usarse dentro de ProveedorAuth');
  return ctx;
}
