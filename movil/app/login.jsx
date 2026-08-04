import React, { useState } from 'react';
import {
  KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View
} from 'react-native';
import { useAuth } from '../src/auth';
import { Aviso, Boton, Campo, Tarjeta } from '../src/ui';
import { colores, esp } from '../src/theme';
import { API_URL, MODO_DEMO } from '../src/config';

export default function Login() {
  const { iniciarSesion } = useAuth();
  const [credencial, setCredencial] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function entrar() {
    setError('');
    if (!credencial || !password) return setError('Ingresa tu usuario y contrasena.');
    setCargando(true);
    try {
      await iniciarSesion(credencial, password);
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colores.fondo }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={s.contenedor} keyboardShouldPersistTaps="handled">
        <View style={s.logo}>
          <Text style={s.logoTexto}>SGMP</Text>
        </View>
        <Text style={s.titulo}>Policlínico</Text>
        <Text style={s.subtitulo}>Sistema de Gestión Médica para Policlínicos</Text>

        <Tarjeta>
          <Aviso mensaje={error} />
          <Campo
            etiqueta="Usuario o correo"
            value={credencial}
            onChangeText={setCredencial}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="admin"
          />
          <Campo
            etiqueta="Contrasena"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="********"
            onSubmitEditing={entrar}
          />
          <Boton titulo="Ingresar" onPress={entrar} cargando={cargando} />
        </Tarjeta>

        {MODO_DEMO ? (
          <Tarjeta>
            <Text style={s.demoTitulo}>Modo demostracion</Text>
            <Text style={s.demoTexto}>
              La app funciona con datos simulados, sin servidor. Usuarios disponibles:
            </Text>
            {[
              ['admin', 'admin123', 'Administrador'],
              ['recepcion', 'recepcion123', 'Recepcionista'],
              ['medico', 'medico123', 'Medico'],
              ['paciente', 'paciente123', 'Paciente']
            ].map(([usuario, clave, rol]) => (
              <Pressable
                key={usuario}
                style={s.credencial}
                onPress={() => { setCredencial(usuario); setPassword(clave); }}
              >
                <Text style={s.credencialUsuario}>{usuario} / {clave}</Text>
                <Text style={s.credencialRol}>{rol}</Text>
              </Pressable>
            ))}
            <Text style={s.demoAyuda}>Toca uno para rellenar el formulario.</Text>
          </Tarjeta>
        ) : (
          <>
            <Text style={s.pie}>
              El acceso se bloquea 15 minutos despues de 10 intentos fallidos.
            </Text>
            <Text style={s.pie}>API: {API_URL}</Text>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  contenedor: { padding: esp.lg, paddingTop: 90, flexGrow: 1 },
  logo: {
    width: 68, height: 68, borderRadius: 20, backgroundColor: colores.primario,
    alignItems: 'center', justifyContent: 'center', marginBottom: esp.md
  },
  logoTexto: { color: '#fff', fontWeight: '800', fontSize: 20 },
  titulo: { fontSize: 28, fontWeight: '800', color: colores.texto },
  subtitulo: { color: colores.textoSuave, marginBottom: esp.lg },
  pie: { color: colores.textoSuave, fontSize: 11, textAlign: 'center', marginTop: esp.sm },
  demoTitulo: { fontWeight: '800', color: colores.primario, marginBottom: 4 },
  demoTexto: { color: colores.textoSuave, fontSize: 13, marginBottom: esp.sm },
  credencial: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderTopWidth: 1, borderTopColor: colores.borde
  },
  credencialUsuario: { color: colores.texto, fontWeight: '600', fontSize: 13 },
  credencialRol: { color: colores.textoSuave, fontSize: 12 },
  demoAyuda: { color: colores.textoSuave, fontSize: 11, marginTop: esp.sm, textAlign: 'center' }
});
