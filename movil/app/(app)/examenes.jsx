import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { api } from '../../src/api';
import { useAuth } from '../../src/auth';
import { Aviso, Cargando, Insignia, Tarjeta, Vacio } from '../../src/ui';
import { colores, colorEstadoValor, esp } from '../../src/theme';
import { formatoLargo } from '../../src/fechas';

/** Examenes del paciente autenticado, con el resumen en lenguaje sencillo. */
export default function MisExamenes() {
  const { usuario } = useAuth();
  const router = useRouter();
  const [examenes, setExamenes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    setError('');
    if (!usuario?.idPaciente) {
      setError('Tu usuario no tiene una ficha de paciente asociada.');
      setCargando(false);
      return;
    }
    try {
      setExamenes(await api.examenesDePaciente(usuario.idPaciente));
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, [usuario]);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  if (cargando) return <Cargando />;

  return (
    <View style={{ flex: 1, backgroundColor: colores.fondo }}>
      <FlatList
        data={examenes}
        keyExtractor={(x) => String(x.id)}
        contentContainerStyle={{ padding: esp.md, paddingBottom: 96 }}
        ListHeaderComponent={<Aviso mensaje={error} />}
        ListEmptyComponent={<Vacio texto="Aun no tienes examenes cargados." />}
        renderItem={({ item }) => (
          <Tarjeta onPress={() => router.push('/examen/' + item.id)}>
            <View style={s.fila}>
              <Text style={s.nombre}>{item.tipo}</Text>
              <Insignia texto={item.estado} color={colorEstadoValor[item.estado] || colores.textoSuave} />
            </View>
            <Text style={s.detalle}>{formatoLargo(item.fecha)}</Text>
            {item.laboratorio ? <Text style={s.detalle}>{item.laboratorio}</Text> : null}
            {item.resumenPaciente ? (
              <Text style={s.resumen} numberOfLines={3}>{item.resumenPaciente}</Text>
            ) : (
              <Text style={s.pendiente}>Resumen en proceso...</Text>
            )}
          </Tarjeta>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  fila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  nombre: { fontWeight: '700', fontSize: 16, color: colores.texto, flex: 1 },
  detalle: { color: colores.textoSuave, fontSize: 13, marginTop: 2 },
  resumen: { color: colores.texto, marginTop: esp.sm, fontSize: 14, lineHeight: 20 },
  pendiente: { color: colores.aviso, marginTop: esp.sm, fontSize: 13, fontStyle: 'italic' }
});
