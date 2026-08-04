import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../../src/api';
import { useAuth } from '../../src/auth';
import { Aviso, Boton, Campo, Tarjeta } from '../../src/ui';
import { colores, esp } from '../../src/theme';

const RECETA_VACIA = { Medicamento: '', Dosis: '', Frecuencia: '', Duracion: '' };

/**
 * Registro de consulta (POST /api/consultas).
 *
 * El backend hace todo en una sola transaccion:
 *   1. Consulta_Medica  2. Signos_Vitales  3. array de Receta_Medicamento
 * Motivo y Diagnostico son obligatorios.
 */
export default function RegistrarConsulta() {
  const { idCita, idPaciente, paciente } = useLocalSearchParams();
  const { usuario } = useAuth();
  const router = useRouter();

  const [c, setC] = useState({
    Motivo: '', Sintomas: '', Diagnostico: '', Tratamiento: '', Observaciones: ''
  });
  const [v, setV] = useState({
    Presion_Arterial: '', Frecuencia_Cardiaca: '', Temperatura: '',
    Peso: '', Estatura: '', Frecuencia_Respiratoria: '', Saturacion_Oxigeno: ''
  });
  const [recetas, setRecetas] = useState([{ ...RECETA_VACIA }]);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const setConsulta = (k) => (valor) => setC((p) => ({ ...p, [k]: valor }));
  const setVital = (k) => (valor) => setV((p) => ({ ...p, [k]: valor }));

  function setReceta(i, k, valor) {
    setRecetas((prev) => prev.map((r, j) => (j === i ? { ...r, [k]: valor } : r)));
  }

  async function guardar() {
    setError('');
    if (!c.Motivo.trim()) return setError('El motivo es obligatorio.');
    if (!c.Diagnostico.trim()) return setError('El diagnostico es obligatorio.');

    const recetasValidas = recetas.filter((r) => r.Medicamento.trim());
    setGuardando(true);
    try {
      await api.registrarConsulta({
        ID_Cita: Number(idCita),
        ID_Paciente: Number(idPaciente),
        ID_Medico: usuario?.idMedico ?? null,
        ...c,
        signos_vitales: v,
        recetas: recetasValidas
      });
      Alert.alert('Consulta registrada', 'La consulta quedo guardada en el historial clinico.', [
        { text: 'Volver a la agenda', onPress: () => router.replace('/(app)/agenda') }
      ]);
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <ScrollView style={{ backgroundColor: colores.fondo }} contentContainerStyle={{ padding: esp.md }}>
      <Aviso mensaje={error} />

      <Tarjeta>
        <Text style={s.paciente}>{paciente || 'Paciente #' + idPaciente}</Text>
        <Text style={s.detalle}>Cita #{idCita}</Text>
      </Tarjeta>

      <Tarjeta>
        <Text style={s.seccion}>Consulta</Text>
        <Campo etiqueta="Motivo *" value={c.Motivo} onChangeText={setConsulta('Motivo')} />
        <Campo etiqueta="Sintomas" value={c.Sintomas} onChangeText={setConsulta('Sintomas')} multiline />
        <Campo etiqueta="Diagnostico *" value={c.Diagnostico} onChangeText={setConsulta('Diagnostico')} multiline />
        <Campo etiqueta="Tratamiento" value={c.Tratamiento} onChangeText={setConsulta('Tratamiento')} multiline />
        <Campo etiqueta="Observaciones" value={c.Observaciones} onChangeText={setConsulta('Observaciones')} multiline />
      </Tarjeta>

      <Tarjeta>
        <Text style={s.seccion}>Signos vitales</Text>
        <View style={s.rejilla}>
          <Campo style={s.mitad} etiqueta="Presion arterial" placeholder="120/80"
            value={v.Presion_Arterial} onChangeText={setVital('Presion_Arterial')} />
          <Campo style={s.mitad} etiqueta="Frec. cardiaca (lpm)" keyboardType="numeric"
            value={v.Frecuencia_Cardiaca} onChangeText={setVital('Frecuencia_Cardiaca')} />
          <Campo style={s.mitad} etiqueta="Temperatura (C)" keyboardType="decimal-pad"
            value={v.Temperatura} onChangeText={setVital('Temperatura')} />
          <Campo style={s.mitad} etiqueta="Frec. respiratoria" keyboardType="numeric"
            value={v.Frecuencia_Respiratoria} onChangeText={setVital('Frecuencia_Respiratoria')} />
          <Campo style={s.mitad} etiqueta="Peso (kg)" keyboardType="decimal-pad"
            value={v.Peso} onChangeText={setVital('Peso')} />
          <Campo style={s.mitad} etiqueta="Estatura (m)" keyboardType="decimal-pad"
            value={v.Estatura} onChangeText={setVital('Estatura')} />
          <Campo style={s.mitad} etiqueta="SpO2 (%)" keyboardType="numeric"
            value={v.Saturacion_Oxigeno} onChangeText={setVital('Saturacion_Oxigeno')} />
        </View>
      </Tarjeta>

      <Tarjeta>
        <Text style={s.seccion}>Receta</Text>
        {recetas.map((r, i) => (
          <View key={i} style={s.receta}>
            <Text style={s.recetaTitulo}>Medicamento {i + 1}</Text>
            <Campo placeholder="Nombre del medicamento" value={r.Medicamento}
              onChangeText={(t) => setReceta(i, 'Medicamento', t)} />
            <View style={s.rejilla}>
              <Campo style={s.mitad} placeholder="Dosis" value={r.Dosis}
                onChangeText={(t) => setReceta(i, 'Dosis', t)} />
              <Campo style={s.mitad} placeholder="Frecuencia" value={r.Frecuencia}
                onChangeText={(t) => setReceta(i, 'Frecuencia', t)} />
            </View>
            <Campo placeholder="Duracion" value={r.Duracion}
              onChangeText={(t) => setReceta(i, 'Duracion', t)} />
            {recetas.length > 1 ? (
              <Boton titulo="Quitar" variante="fantasma"
                onPress={() => setRecetas((prev) => prev.filter((_, j) => j !== i))} />
            ) : null}
          </View>
        ))}
        <Boton titulo="+ Agregar medicamento" variante="secundario"
          onPress={() => setRecetas((prev) => [...prev, { ...RECETA_VACIA }])} />
      </Tarjeta>

      <Boton titulo="Guardar consulta" onPress={guardar} cargando={guardando} />
      <View style={{ height: esp.xl }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  paciente: { fontWeight: '800', fontSize: 18, color: colores.texto },
  detalle: { color: colores.textoSuave, fontSize: 13 },
  seccion: { fontWeight: '800', fontSize: 16, marginBottom: esp.md, color: colores.texto },
  rejilla: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  mitad: { width: '48%' },
  receta: { borderTopWidth: 1, borderTopColor: colores.borde, paddingTop: esp.md, marginBottom: esp.sm },
  recetaTitulo: { fontWeight: '700', color: colores.primario, marginBottom: esp.sm }
});
