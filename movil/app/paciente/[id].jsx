import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../../src/api';
import { useAuth } from '../../src/auth';
import { Aviso, Boton, Cargando, Chip, Dato, Insignia, Tarjeta, Vacio } from '../../src/ui';
import { colores, colorEstadoValor, esp } from '../../src/theme';
import { formatoLargo } from '../../src/fechas';

/**
 * Ficha del paciente: datos, historial clinico (GET /api/consultas/paciente/:id)
 * y examenes de laboratorio (GET /api/examenes/paciente/:id).
 */
export default function FichaPaciente() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { esMedico, esAdmin } = useAuth();

  const [paciente, setPaciente] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [examenes, setExamenes] = useState([]);
  const [pestana, setPestana] = useState('historial');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    setError('');
    try {
      const p = await api.paciente(id);
      setPaciente(p);
      const [h, x] = await Promise.all([
        api.historial(id).catch(() => []),
        api.examenesDePaciente(id).catch(() => [])
      ]);
      setHistorial(h);
      setExamenes(x);
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, [id]);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  if (cargando) return <Cargando />;
  if (!paciente) return <View style={{ padding: esp.md }}><Aviso mensaje={error || 'Paciente no encontrado'} /></View>;

  const datos = pestana === 'historial' ? historial : examenes;

  return (
    <FlatList
      style={{ backgroundColor: colores.fondo }}
      data={datos}
      keyExtractor={(item) => pestana + '-' + item.id}
      contentContainerStyle={{ padding: esp.md }}
      ListHeaderComponent={
        <>
          <Aviso mensaje={error} />
          <Tarjeta>
            <Text style={s.nombre}>{paciente.nombreCompleto}</Text>
            <Dato titulo="DNI" valor={paciente.dni} />
            <Dato titulo="Fecha de nacimiento" valor={paciente.fechaNacimiento && formatoLargo(paciente.fechaNacimiento)} />
            <Dato titulo="Telefono" valor={paciente.telefono} />
            <Dato titulo="Correo" valor={paciente.correo} />
            <Dato titulo="Direccion" valor={paciente.direccion} />
          </Tarjeta>

          <View style={s.pestanas}>
            <Chip texto={'Historial (' + historial.length + ')'} activo={pestana === 'historial'}
              onPress={() => setPestana('historial')} />
            <Chip texto={'Examenes (' + examenes.length + ')'} activo={pestana === 'examenes'}
              onPress={() => setPestana('examenes')} />
          </View>

          {pestana === 'examenes' ? (
            <Boton titulo="+ Subir examen" variante="secundario" style={{ marginBottom: esp.md }}
              onPress={() => router.push({ pathname: '/examen/subir', params: { idPaciente: paciente.id } })} />
          ) : null}
        </>
      }
      ListEmptyComponent={
        <Vacio texto={pestana === 'historial' ? 'Sin consultas registradas.' : 'Sin examenes cargados.'} />
      }
      renderItem={({ item }) =>
        pestana === 'historial' ? (
          <Tarjeta>
            <Text style={s.fecha}>{formatoLargo(item.fecha)}</Text>
            {item.medico ? <Text style={s.medico}>Dr(a). {item.medico}</Text> : null}
            <Dato titulo="Motivo" valor={item.motivo} />
            <Dato titulo="Sintomas" valor={item.sintomas} />
            <Dato titulo="Diagnostico" valor={item.diagnostico} />
            <Dato titulo="Tratamiento" valor={item.tratamiento} />
            <Dato titulo="Observaciones" valor={item.observaciones} />

            {item.signos ? (
              <View style={s.signos}>
                <Text style={s.subtitulo}>Signos vitales</Text>
                <Text style={s.signosTexto}>
                  {[
                    item.signos.presion && 'PA ' + item.signos.presion,
                    item.signos.frecuenciaCardiaca && 'FC ' + item.signos.frecuenciaCardiaca,
                    item.signos.temperatura && 'T ' + item.signos.temperatura,
                    item.signos.frecuenciaRespiratoria && 'FR ' + item.signos.frecuenciaRespiratoria,
                    item.signos.saturacion && 'SpO2 ' + item.signos.saturacion,
                    item.signos.peso && item.signos.peso + ' kg',
                    item.signos.estatura && item.signos.estatura + ' m'
                  ].filter(Boolean).join('  -  ') || 'Sin registro'}
                </Text>
              </View>
            ) : null}

            {item.recetas && item.recetas.length ? (
              <View style={s.signos}>
                <Text style={s.subtitulo}>Receta</Text>
                {item.recetas.map((r) => (
                  <Text key={r.id || r.medicamento} style={s.signosTexto}>
                    {r.medicamento} {r.dosis ? '- ' + r.dosis : ''} {r.frecuencia ? '- ' + r.frecuencia : ''}
                    {r.duracion ? ' - ' + r.duracion : ''}
                  </Text>
                ))}
              </View>
            ) : null}
          </Tarjeta>
        ) : (
          <Tarjeta onPress={() => router.push('/examen/' + item.id)}>
            <View style={s.fila}>
              <Text style={s.fecha}>{item.tipo}</Text>
              <Insignia texto={item.estado} color={colorEstadoValor[item.estado] || colores.textoSuave} />
            </View>
            <Text style={s.detalle}>{formatoLargo(item.fecha)}</Text>
            {item.sensible ? <Text style={s.sensible}>Examen sensible - acceso auditado</Text> : null}
            {(esMedico || esAdmin) && item.resumenMedico ? (
              <Text style={s.resumen} numberOfLines={3}>{item.resumenMedico}</Text>
            ) : null}
          </Tarjeta>
        )
      }
    />
  );
}

const s = StyleSheet.create({
  nombre: { fontWeight: '800', fontSize: 20, color: colores.texto, marginBottom: esp.xs },
  pestanas: { flexDirection: 'row', marginBottom: esp.sm },
  fila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fecha: { fontWeight: '700', color: colores.texto, flex: 1 },
  medico: { color: colores.primario, fontWeight: '600', fontSize: 13 },
  detalle: { color: colores.textoSuave, fontSize: 13, marginTop: 2 },
  subtitulo: { fontWeight: '700', color: colores.texto, fontSize: 13, marginBottom: 2 },
  signos: { marginTop: esp.md, borderTopWidth: 1, borderTopColor: colores.borde, paddingTop: esp.sm },
  signosTexto: { color: colores.textoSuave, fontSize: 13 },
  sensible: { color: colores.peligro, fontSize: 12, fontWeight: '700', marginTop: 4 },
  resumen: { color: colores.texto, marginTop: esp.sm, fontSize: 14, lineHeight: 20 }
});
