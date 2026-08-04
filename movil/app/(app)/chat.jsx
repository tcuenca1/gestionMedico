import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Modal, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { api } from '../../src/api';
import { escuchar } from '../../src/socket';
import { Aviso, Boton, Cargando, Insignia, Tarjeta, Vacio } from '../../src/ui';
import { colores, esp } from '../../src/theme';

/**
 * Lista de conversaciones. Se refresca sola cuando llegan los eventos
 * mensaje:nuevo y conversacion:nueva por Socket.IO.
 */
export default function Chat() {
  const router = useRouter();
  const [conversaciones, setConversaciones] = useState([]);
  const [contactos, setContactos] = useState([]);
  const [modal, setModal] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    setError('');
    try {
      setConversaciones(await api.conversaciones());
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  useEffect(() => {
    const quitarNuevo = escuchar('mensaje:nuevo', cargar);
    const quitarConv = escuchar('conversacion:nueva', cargar);
    return () => { quitarNuevo(); quitarConv(); };
  }, [cargar]);

  async function abrirSelector() {
    try {
      setContactos(await api.usuariosChat());
      setModal(true);
    } catch (e) {
      setError(e.message);
    }
  }

  async function iniciarCon(contacto) {
    try {
      const id = contacto.ID_Usuario || contacto.id || contacto.idUsuario;
      const conv = await api.abrirConversacion(id);
      setModal(false);
      router.push({
        pathname: '/chat/' + conv.id,
        params: { titulo: contacto.nombreCompleto || contacto.Username || 'Conversacion' }
      });
    } catch (e) {
      setError(e.message);
    }
  }

  if (cargando) return <Cargando />;

  return (
    <View style={{ flex: 1, backgroundColor: colores.fondo }}>
      <FlatList
        data={conversaciones}
        keyExtractor={(c) => String(c.id)}
        contentContainerStyle={{ padding: esp.md, paddingBottom: 96 }}
        ListHeaderComponent={<Aviso mensaje={error} />}
        ListEmptyComponent={<Vacio texto="No tienes conversaciones todavia." />}
        renderItem={({ item }) => (
          <Tarjeta
            onPress={() => router.push({ pathname: '/chat/' + item.id, params: { titulo: item.titulo } })}
          >
            <View style={s.fila}>
              <Text style={s.titulo}>{item.titulo}</Text>
              {item.noLeidos > 0 ? <Insignia texto={String(item.noLeidos)} color={colores.peligro} /> : null}
            </View>
            {item.ultimoMensaje ? (
              <Text style={s.previa} numberOfLines={1}>{item.ultimoMensaje}</Text>
            ) : null}
          </Tarjeta>
        )}
      />

      <View style={s.flotante}>
        <Boton titulo="+ Nueva conversacion" onPress={abrirSelector} />
      </View>

      <Modal visible={modal} animationType="slide" onRequestClose={() => setModal(false)}>
        <View style={{ flex: 1, backgroundColor: colores.fondo, padding: esp.md, paddingTop: 60 }}>
          <Text style={s.modalTitulo}>Iniciar conversacion</Text>
          <FlatList
            data={contactos}
            keyExtractor={(u, i) => String(u.ID_Usuario || u.id || i)}
            ListEmptyComponent={<Vacio texto="No hay usuarios disponibles." />}
            renderItem={({ item }) => (
              <Tarjeta onPress={() => iniciarCon(item)}>
                <Text style={s.titulo}>
                  {item.nombreCompleto || item.nombre_completo || item.Username || item.username}
                </Text>
                <Text style={s.previa}>{item.rol || item.Rol || ''}</Text>
              </Tarjeta>
            )}
          />
          <Boton titulo="Cerrar" variante="fantasma" onPress={() => setModal(false)} />
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  fila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titulo: { fontWeight: '700', fontSize: 16, color: colores.texto, flex: 1 },
  previa: { color: colores.textoSuave, fontSize: 13, marginTop: 2 },
  modalTitulo: { fontWeight: '800', fontSize: 20, color: colores.texto, marginBottom: esp.md },
  flotante: { position: 'absolute', left: esp.md, right: esp.md, bottom: esp.md }
});
