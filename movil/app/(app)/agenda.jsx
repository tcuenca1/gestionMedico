import React, { useCallback, useState } from 'react';
import { Alert, FlatList, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { api } from '../../src/api';
import { useAuth } from '../../src/auth';
import { Aviso, Boton, Cargando, Chip, Insignia, Tarjeta, Vacio } from '../../src/ui';
import { colores, colorEstadoCita, esp } from '../../src/theme';
import { formatoLargo, hoyISO, proximosDias } from '../../src/fechas';

/**
 * Agenda unificada.
 *   Medico       -> GET /api/citas/medico/:id
 *   Paciente     -> GET /api/citas/paciente/:id
 *   Recepcion    -> GET /api/citas/fecha/:fecha  (selector de dia)
 *   Admin        -> GET /api/citas
 */
export default function Agenda() {
  const { usuario, esMedico, esPaciente, esRecepcion, esAdmin } = useAuth();
  const router = useRouter();

  const [citas, setCitas] = useState([]);
  const [fecha, setFecha] = useState(hoyISO());
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState('');

  const dias = proximosDias(14);
  const usaSelectorDeDia = esRecepcion;

  const cargar = useCallback(async () => {
    setError('');
    try {
      let datos = [];
      if (esMedico && usuario?.idMedico) datos = await api.citasDeMedico(usuario.idMedico);
      else if (esPaciente && usuario?.idPaciente) datos = await api.citasDePaciente(usuario.idPaciente);
      else if (esRecepcion) datos = await api.citasPorFecha(fecha);
      else datos = await api.citas();
      setCitas(datos);
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, [usuario, esMedico, esPaciente, esRecepcion, fecha]);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  const visibles = estadoFiltro ? citas.filter((c) => c.estado === estadoFiltro) : citas;

  async function cambiarEstado(cita, estado) {
    try {
      await api.cambiarEstadoCita(cita.id, estado);
      cargar();
    } catch (e) {
      Alert.alert('No se pudo actualizar', e.message);
    }
  }

  function pedirCancelacion(cita) {
    Alert.alert(
      'Cancelar cita',
      'La cita del ' + formatoLargo(cita.fecha) + ' a las ' + cita.hora + ' pasara a estado Cancelada.',
      [
        { text: 'Volver', style: 'cancel' },
        {
          text: 'Cancelar cita',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.cancelarCita(cita.id);
              cargar();
            } catch (e) {
              Alert.alert('Error', e.message);
            }
          }
        }
      ]
    );
  }

  if (cargando) return <Cargando />;

  return (
    <View style={{ flex: 1, backgroundColor: colores.fondo }}>
      {usaSelectorDeDia ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          style={{ maxHeight: 52 }} contentContainerStyle={{ paddingHorizontal: esp.md, paddingTop: esp.sm }}>
          {dias.map((d) => (
            <Chip key={d.iso} texto={d.diaCorto + ' ' + d.numero} activo={fecha === d.iso}
              onPress={() => setFecha(d.iso)} />
          ))}
        </ScrollView>
      ) : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={{ maxHeight: 52 }} contentContainerStyle={{ paddingHorizontal: esp.md, paddingTop: esp.sm }}>
        <Chip texto="Todas" activo={!estadoFiltro} onPress={() => setEstadoFiltro('')} />
        {['Pendiente', 'En Espera', 'Atendida', 'Cancelada'].map((e2) => (
          <Chip key={e2} texto={e2} activo={estadoFiltro === e2} onPress={() => setEstadoFiltro(e2)} />
        ))}
      </ScrollView>

      <FlatList
        data={visibles}
        keyExtractor={(c) => String(c.id)}
        contentContainerStyle={{ padding: esp.md, paddingBottom: 96 }}
        refreshControl={
          <RefreshControl refreshing={refrescando} onRefresh={() => { setRefrescando(true); cargar(); }} />
        }
        ListHeaderComponent={<Aviso mensaje={error} />}
        ListEmptyComponent={<Vacio texto="No hay citas para mostrar." />}
        renderItem={({ item }) => (
          <Tarjeta>
            <View style={s.fila}>
              <Text style={s.fecha}>{formatoLargo(item.fecha)}</Text>
              <Insignia texto={item.estado} color={colorEstadoCita[item.estado]} />
            </View>
            <Text style={s.hora}>{item.hora}</Text>

            {esPaciente ? (
              <Text style={s.persona}>{item.medico ? 'Dr(a). ' + item.medico : 'Medico por asignar'}</Text>
            ) : (
              <Text style={s.persona}>{item.paciente || 'Paciente N/D'}</Text>
            )}
            {item.especialidad ? <Text style={s.detalle}>{item.especialidad}</Text> : null}
            {item.motivo ? <Text style={s.detalle}>Motivo: {item.motivo}</Text> : null}

            <View style={s.acciones}>
              {esMedico && item.estado !== 'Cancelada' ? (
                <>
                  {item.estado === 'Pendiente' ? (
                    <Boton titulo="En espera" variante="secundario" style={s.accion}
                      onPress={() => cambiarEstado(item, 'En Espera')} />
                  ) : null}
                  {item.estado !== 'Atendida' ? (
                    <Boton titulo="Atender" style={s.accion}
                      onPress={() =>
                        router.push({
                          pathname: '/consulta/' + item.id,
                          params: { idPaciente: item.idPaciente, paciente: item.paciente }
                        })
                      } />
                  ) : (
                    <Boton titulo="Ver historial" variante="secundario" style={s.accion}
                      onPress={() => router.push('/paciente/' + item.idPaciente)} />
                  )}
                </>
              ) : null}

              {(esRecepcion || esAdmin) && item.estado !== 'Cancelada' ? (
                <>
                  <Boton titulo="En espera" variante="secundario" style={s.accion}
                    onPress={() => cambiarEstado(item, 'En Espera')} />
                  <Boton titulo="Cancelar" variante="peligro" style={s.accion}
                    onPress={() => pedirCancelacion(item)} />
                </>
              ) : null}

              {esPaciente && item.estado === 'Pendiente' ? (
                <Boton titulo="Cancelar cita" variante="peligro" style={s.accion}
                  onPress={() => pedirCancelacion(item)} />
              ) : null}
            </View>
          </Tarjeta>
        )}
      />

      {esRecepcion || esAdmin ? (
        <View style={s.flotante}>
          <Boton titulo="+ Nueva cita" onPress={() => router.push('/cita/nueva')} />
        </View>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  fila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fecha: { fontWeight: '700', color: colores.texto, fontSize: 15, flex: 1 },
  hora: { fontSize: 26, fontWeight: '800', color: colores.primario, marginVertical: 2 },
  persona: { color: colores.texto, fontWeight: '600' },
  detalle: { color: colores.textoSuave, marginTop: 2, fontSize: 13 },
  acciones: { flexDirection: 'row', flexWrap: 'wrap', gap: esp.sm, marginTop: esp.md },
  accion: { flexGrow: 1, flexBasis: 120 },
  flotante: { position: 'absolute', left: esp.md, right: esp.md, bottom: esp.md }
});
