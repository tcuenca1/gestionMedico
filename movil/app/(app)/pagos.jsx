import React, { useCallback, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { api } from '../../src/api';
import { Aviso, Boton, Cargando, Insignia, Tarjeta, Vacio } from '../../src/ui';
import { colores, colorEstadoPago, esp } from '../../src/theme';
import { dinero, formatoLargo } from '../../src/fechas';

/** Pagos de recepcion. Un pago corresponde a una consulta (UNIQUE ID_Consulta). */
export default function Pagos() {
  const [pagos, setPagos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    setError('');
    try {
      setPagos(await api.pagos());
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  async function cambiar(pago, estado) {
    try {
      await api.actualizarPago(pago.id, estado);
      cargar();
    } catch (e) {
      Alert.alert('No se pudo actualizar', e.message);
    }
  }

  const total = pagos
    .filter((p) => p.estado === 'Completado')
    .reduce((suma, p) => suma + p.monto, 0);

  if (cargando) return <Cargando />;

  return (
    <FlatList
      style={{ backgroundColor: colores.fondo }}
      data={pagos}
      keyExtractor={(p) => String(p.id)}
      contentContainerStyle={{ padding: esp.md }}
      ListHeaderComponent={
        <>
          <Aviso mensaje={error} />
          <Tarjeta>
            <Text style={s.totalTitulo}>Total cobrado (Completado)</Text>
            <Text style={s.total}>{dinero(total)}</Text>
          </Tarjeta>
        </>
      }
      ListEmptyComponent={<Vacio texto="No hay pagos registrados." />}
      renderItem={({ item }) => (
        <Tarjeta>
          <View style={s.fila}>
            <Text style={s.monto}>{dinero(item.monto)}</Text>
            <Insignia texto={item.estado} color={colorEstadoPago[item.estado]} />
          </View>
          {item.paciente ? <Text style={s.detalle}>{item.paciente}</Text> : null}
          <Text style={s.detalle}>Consulta #{item.idConsulta}</Text>
          {item.metodo ? <Text style={s.detalle}>Metodo: {item.metodo}</Text> : null}
          {item.fecha ? <Text style={s.detalle}>{formatoLargo(item.fecha)}</Text> : null}

          {item.estado === 'Pendiente' ? (
            <View style={s.acciones}>
              <Boton titulo="Marcar completado" style={s.accion} onPress={() => cambiar(item, 'Completado')} />
              <Boton titulo="Anular" variante="peligro" style={s.accion} onPress={() => cambiar(item, 'Anulado')} />
            </View>
          ) : null}
        </Tarjeta>
      )}
    />
  );
}

const s = StyleSheet.create({
  fila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  monto: { fontSize: 22, fontWeight: '800', color: colores.texto },
  detalle: { color: colores.textoSuave, fontSize: 13, marginTop: 2 },
  totalTitulo: { color: colores.textoSuave, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  total: { fontSize: 30, fontWeight: '800', color: colores.exito },
  acciones: { flexDirection: 'row', gap: esp.sm, marginTop: esp.md },
  accion: { flex: 1 }
});
