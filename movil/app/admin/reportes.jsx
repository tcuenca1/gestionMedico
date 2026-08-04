import React, { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { api } from '../../src/api';
import { Aviso, Boton, Campo, Insignia, Tarjeta, Vacio } from '../../src/ui';
import { colores, colorEstadoPago, esp } from '../../src/theme';
import { dinero, formatoLargo, hoyISO } from '../../src/fechas';

/** GET /api/pagos/reporte?inicio=&fin= */
export default function Reportes() {
  const [inicio, setInicio] = useState(hoyISO().slice(0, 8) + '01');
  const [fin, setFin] = useState(hoyISO());
  const [pagos, setPagos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [consultado, setConsultado] = useState(false);

  async function generar() {
    setError('');
    setCargando(true);
    try {
      setPagos(await api.reportePagos(inicio, fin));
      setConsultado(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }

  const total = pagos
    .filter((p) => p.estado === 'Completado')
    .reduce((suma, p) => suma + p.monto, 0);

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
            <Campo etiqueta="Desde (AAAA-MM-DD)" value={inicio} onChangeText={setInicio} autoCapitalize="none" />
            <Campo etiqueta="Hasta (AAAA-MM-DD)" value={fin} onChangeText={setFin} autoCapitalize="none" />
            <Boton titulo="Generar reporte" onPress={generar} cargando={cargando} />
          </Tarjeta>
          {consultado ? (
            <Tarjeta>
              <Text style={s.totalTitulo}>Total completado en el periodo</Text>
              <Text style={s.total}>{dinero(total)}</Text>
              <Text style={s.detalle}>{pagos.length} pagos encontrados</Text>
            </Tarjeta>
          ) : null}
        </>
      }
      ListEmptyComponent={consultado ? <Vacio texto="Sin pagos en el rango indicado." /> : null}
      renderItem={({ item }) => (
        <Tarjeta>
          <View style={s.fila}>
            <Text style={s.monto}>{dinero(item.monto)}</Text>
            <Insignia texto={item.estado} color={colorEstadoPago[item.estado]} />
          </View>
          {item.paciente ? <Text style={s.detalle}>{item.paciente}</Text> : null}
          {item.fecha ? <Text style={s.detalle}>{formatoLargo(item.fecha)}</Text> : null}
        </Tarjeta>
      )}
    />
  );
}

const s = StyleSheet.create({
  fila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  monto: { fontSize: 20, fontWeight: '800', color: colores.texto },
  detalle: { color: colores.textoSuave, fontSize: 13, marginTop: 2 },
  totalTitulo: { color: colores.textoSuave, fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  total: { fontSize: 30, fontWeight: '800', color: colores.exito }
});
