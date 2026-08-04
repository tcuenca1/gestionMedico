import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../src/auth';
import { Boton, Dato, Insignia, Tarjeta } from '../../src/ui';
import { colores, esp } from '../../src/theme';
import { API_URL } from '../../src/config';

export default function Perfil() {
  const { usuario, cerrarSesion } = useAuth();
  if (!usuario) return null;

  return (
    <ScrollView style={{ backgroundColor: colores.fondo }} contentContainerStyle={{ padding: esp.md }}>
      <Tarjeta>
        <View style={s.cabecera}>
          <View style={s.avatar}>
            <Text style={s.avatarTexto}>
              {String(usuario.nombreCompleto || usuario.username || '?').slice(0, 2).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.nombre}>{usuario.nombreCompleto || usuario.username}</Text>
            <Text style={s.correo}>{usuario.correo || usuario.username}</Text>
            <Insignia texto={usuario.rolTexto || usuario.rol} />
          </View>
        </View>
      </Tarjeta>

      <Tarjeta>
        <Dato titulo="Usuario" valor={usuario.username} />
        <Dato titulo="ID de usuario" valor={usuario.id} />
        <Dato titulo="ID de medico" valor={usuario.idMedico} />
        <Dato titulo="ID de paciente" valor={usuario.idPaciente} />
        <Dato titulo="Servidor" valor={API_URL} />
      </Tarjeta>

      <Text style={s.nota}>
        La sesion usa un JWT que expira a las 10 horas. Al vencer, la app te devuelve al login.
      </Text>

      <Boton titulo="Cerrar sesion" variante="peligro" onPress={cerrarSesion} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  cabecera: { flexDirection: 'row', gap: esp.md, alignItems: 'center' },
  avatar: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: colores.primario,
    alignItems: 'center', justifyContent: 'center'
  },
  avatarTexto: { color: '#fff', fontWeight: '800', fontSize: 18 },
  nombre: { fontWeight: '800', fontSize: 18, color: colores.texto },
  correo: { color: colores.textoSuave, marginBottom: 6 },
  nota: { color: colores.textoSuave, fontSize: 12, marginBottom: esp.md, textAlign: 'center' }
});
