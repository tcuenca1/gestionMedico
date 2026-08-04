import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { api } from '../../src/api';
import { Aviso, Boton, Cargando, Metrica, Tarjeta } from '../../src/ui';
import { colores, esp } from '../../src/theme';
import { dinero, formatoLargo, hoyISO } from '../../src/fechas';

/**
 * Panel de administrador. Consume GET /api/dashboard/stats, que ejecuta
 * 7 queries en paralelo y acepta ?fecha=YYYY-MM-DD.
 */
export default function Panel() {
  const router = useRouter();
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState('');
  const fecha = hoyISO();

  const cargar = useCallback(async () => {
    setError('');
    try {
      setDatos(await api.estadisticas(fecha));
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, [fecha]);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  if (cargando) return <Cargando />;

  return (
    <ScrollView
      style={{ backgroundColor: colores.fondo }}
      contentContainerStyle={{ padding: esp.md }}
      refreshControl={
        <RefreshControl refreshing={refrescando} onRefresh={() => { setRefrescando(true); cargar(); }} />
      }
    >
      <Aviso mensaje={error} />
      <Text style={s.fecha}>{formatoLargo(fecha)}</Text>

      <View style={s.rejilla}>
        <Metrica titulo="Citas de hoy" valor={datos?.citasHoy ?? 0} />
        <Metrica titulo="Pendientes" valor={datos?.citasPendientes ?? 0} color={colores.aviso} />
        <Metrica titulo="Atendidas" valor={datos?.citasAtendidas ?? 0} color={colores.exito} />
        <Metrica titulo="Ingresos del dia" valor={dinero(datos?.ingresosHoy)} color={colores.exito} />
        <Metrica titulo="Medicos" valor={datos?.totalMedicos ?? 0} />
        <Metrica titulo="Pacientes" valor={datos?.totalPacientes ?? 0} />
        <Metrica titulo="Especialidades" valor={datos?.totalEspecialidades ?? 0} />
      </View>

      <Tarjeta>
        <Text style={s.seccion}>Administracion</Text>
        <Boton titulo="Gestionar medicos" variante="secundario" style={{ marginBottom: esp.sm }}
          onPress={() => router.push('/admin/medicos')} />
        <Boton titulo="Gestionar especialidades" variante="secundario" style={{ marginBottom: esp.sm }}
          onPress={() => router.push('/admin/especialidades')} />
        <Boton titulo="Reporte de pagos" variante="secundario"
          onPress={() => router.push('/admin/reportes')} />
      </Tarjeta>

      <Text style={s.nota}>
        Los ingresos consideran unicamente los pagos en estado Completado.
      </Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  fecha: { color: colores.textoSuave, marginBottom: esp.sm, fontWeight: '600' },
  rejilla: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: esp.md },
  seccion: { fontWeight: '800', fontSize: 16, marginBottom: esp.md, color: colores.texto },
  nota: { color: colores.textoSuave, fontSize: 12, textAlign: 'center', marginBottom: esp.lg }
});
