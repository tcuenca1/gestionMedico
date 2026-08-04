import React, { useCallback, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { api } from '../../src/api';
import { Aviso, Boton, Campo, Cargando, Tarjeta, Vacio } from '../../src/ui';
import { colores, esp } from '../../src/theme';

/** El backend impide borrar una especialidad con medicos asociados (FK RESTRICT). */
export default function AdminEspecialidades() {
  const [lista, setLista] = useState([]);
  const [nueva, setNueva] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    setError('');
    try {
      setLista(await api.especialidades());
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  async function crear() {
    if (!nueva.trim()) return;
    setGuardando(true);
    setError('');
    try {
      await api.crearEspecialidad(nueva.trim());
      setNueva('');
      await cargar();
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  }

  function pedirBorrado(item) {
    Alert.alert('Eliminar especialidad', 'Se eliminara "' + item.nombre + '".', [
      { text: 'Volver', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.eliminarEspecialidad(item.id);
            cargar();
          } catch (e) {
            Alert.alert('No se pudo eliminar', e.message + '\n\nProbablemente tiene medicos asociados.');
          }
        }
      }
    ]);
  }

  if (cargando) return <Cargando />;

  return (
    <View style={{ flex: 1, backgroundColor: colores.fondo }}>
      <View style={{ padding: esp.md, paddingBottom: 0 }}>
        <Aviso mensaje={error} />
        <Campo placeholder="Nueva especialidad" value={nueva} onChangeText={setNueva} />
        <Boton titulo="Agregar" onPress={crear} cargando={guardando} />
      </View>
      <FlatList
        data={lista}
        keyExtractor={(e2) => String(e2.id)}
        contentContainerStyle={{ padding: esp.md }}
        ListEmptyComponent={<Vacio texto="No hay especialidades." />}
        renderItem={({ item }) => (
          <Tarjeta>
            <View style={s.fila}>
              <Text style={s.nombre}>{item.nombre}</Text>
              <Boton titulo="Eliminar" variante="peligro" onPress={() => pedirBorrado(item)} />
            </View>
          </Tarjeta>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: esp.md },
  nombre: { fontWeight: '700', fontSize: 16, color: colores.texto, flex: 1 }
});
