import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { api } from '../../src/api';
import { useAuth } from '../../src/auth';
import { conectarSocket, emitir, escuchar } from '../../src/socket';
import { normMensaje } from '../../src/modelos';
import { Aviso, Cargando } from '../../src/ui';
import { colores, esp, radio } from '../../src/theme';
import { formatoHora } from '../../src/fechas';

/**
 * Conversacion en tiempo real.
 *   Al entrar emite conversacion:abrir (une a la sala conv_{id} y marca leidos).
 *   Al salir emite conversacion:salir.
 *   Escucha mensaje:nuevo para agregar mensajes entrantes.
 */
export default function Conversacion() {
  const { id, titulo } = useLocalSearchParams();
  const { usuario } = useAuth();
  const navegacion = useNavigation();
  const lista = useRef(null);

  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (titulo) navegacion.setOptions({ title: String(titulo) });
  }, [titulo]);

  const cargar = useCallback(async () => {
    try {
      setMensajes(await api.mensajes(id));
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, [id]);

  useEffect(() => {
    let quitar = () => {};
    (async () => {
      await conectarSocket();
      await cargar();
      emitir('conversacion:abrir', { idConversacion: Number(id), ID_Conversacion: Number(id) });
      quitar = escuchar('mensaje:nuevo', (bruto) => {
        const m = normMensaje(bruto && (bruto.mensaje || bruto));
        if (!m || String(m.idConversacion) !== String(id)) return;
        setMensajes((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
      });
    })();
    return () => {
      quitar();
      emitir('conversacion:salir', { idConversacion: Number(id), ID_Conversacion: Number(id) });
    };
  }, [id, cargar]);

  function enviar() {
    const contenido = texto.trim();
    if (!contenido) return;
    emitir('mensaje:enviar', {
      idConversacion: Number(id),
      ID_Conversacion: Number(id),
      contenido,
      Contenido: contenido
    });
    setTexto('');
  }

  if (cargando) return <Cargando />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colores.fondo }} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={lista}
          data={mensajes}
          keyExtractor={(m, i) => String(m.id || i)}
          contentContainerStyle={{ padding: esp.md }}
          onContentSizeChange={() => lista.current?.scrollToEnd({ animated: true })}
          ListHeaderComponent={<Aviso mensaje={error} />}
          renderItem={({ item }) => {
            if (item.tipo === 'sistema') {
              return (
                <View style={s.sistema}>
                  <Text style={s.sistemaTexto}>{item.texto}</Text>
                </View>
              );
            }
            const propio = String(item.idEmisor) === String(usuario?.id);
            return (
              <View style={[s.burbuja, propio ? s.propia : s.ajena]}>
                {!propio ? <Text style={s.remitente}>{item.remitenteNombre || 'Usuario'}</Text> : null}
                <Text style={[s.texto, propio && { color: '#fff' }]}>{item.texto}</Text>
                <Text style={[s.hora, propio && { color: '#ffffffaa' }]}>{formatoHora(item.fecha)}</Text>
              </View>
            );
          }}
        />

        <View style={s.barra}>
          <TextInput
            style={s.entrada}
            value={texto}
            onChangeText={setTexto}
            placeholder="Escribe un mensaje"
            placeholderTextColor={colores.textoSuave}
            multiline
            onSubmitEditing={enviar}
          />
          <Pressable onPress={enviar} style={s.enviar}>
            <Text style={s.enviarTexto}>Enviar</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  burbuja: { maxWidth: '80%', padding: esp.sm + 2, borderRadius: radio, marginBottom: esp.sm },
  propia: { alignSelf: 'flex-end', backgroundColor: colores.primario },
  ajena: { alignSelf: 'flex-start', backgroundColor: colores.tarjeta, borderWidth: 1, borderColor: colores.borde },
  remitente: { fontSize: 11, fontWeight: '700', color: colores.primario, marginBottom: 2 },
  texto: { color: colores.texto, fontSize: 15 },
  hora: { color: colores.textoSuave, fontSize: 10, marginTop: 2, alignSelf: 'flex-end' },
  sistema: { alignSelf: 'center', backgroundColor: colores.primarioSuave, borderRadius: 999, paddingHorizontal: esp.md, paddingVertical: 6, marginBottom: esp.sm },
  sistemaTexto: { color: colores.primario, fontSize: 12, fontWeight: '600', textAlign: 'center' },
  barra: {
    flexDirection: 'row', alignItems: 'flex-end', gap: esp.sm, padding: esp.sm,
    borderTopWidth: 1, borderTopColor: colores.borde, backgroundColor: colores.tarjeta
  },
  entrada: {
    flex: 1, maxHeight: 120, borderWidth: 1, borderColor: colores.borde, borderRadius: radio,
    paddingHorizontal: 12, paddingVertical: 10, color: colores.texto, backgroundColor: '#fff'
  },
  enviar: { backgroundColor: colores.primario, borderRadius: radio, paddingHorizontal: esp.md, paddingVertical: 12 },
  enviarTexto: { color: '#fff', fontWeight: '700' }
});
