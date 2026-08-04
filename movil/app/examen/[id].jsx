import React, { useCallback, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { api } from '../../src/api';
import { useAuth } from '../../src/auth';
import { Aviso, Boton, Cargando, Insignia, Tarjeta } from '../../src/ui';
import { colores, colorEstadoValor, esp } from '../../src/theme';
import { formatoLargo } from '../../src/fechas';

/**
 * Detalle de examen: valores extraidos por OCR comparados contra
 * Rango_Referencia (normal / alterado / critico) y los dos resumenes
 * generados por IA (tecnico para el medico, sencillo para el paciente).
 */
export default function DetalleExamen() {
  const { id } = useLocalSearchParams();
  const { esPaciente, esMedico, esAdmin } = useAuth();

  const [examen, setExamen] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [regenerando, setRegenerando] = useState(false);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    setError('');
    try {
      setExamen(await api.examen(id));
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, [id]);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  async function abrirArchivo() {
    try {
      const url = await api.urlArchivoExamen(id);
      const puede = await Linking.canOpenURL(url);
      if (!puede) throw new Error('No hay una aplicacion para abrir este archivo.');
      await Linking.openURL(url);
    } catch (e) {
      Alert.alert('No se pudo abrir', e.message);
    }
  }

  async function regenerar() {
    setRegenerando(true);
    try {
      await api.regenerarResumen(id);
      await cargar();
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setRegenerando(false);
    }
  }

  if (cargando) return <Cargando />;
  if (!examen) return <View style={{ padding: esp.md }}><Aviso mensaje={error || 'Examen no encontrado'} /></View>;

  const resumen = esPaciente ? examen.resumenPaciente : examen.resumenMedico || examen.resumenPaciente;

  return (
    <ScrollView style={{ backgroundColor: colores.fondo }} contentContainerStyle={{ padding: esp.md }}>
      <Aviso mensaje={error} />

      <Tarjeta>
        <View style={s.fila}>
          <Text style={s.titulo}>{examen.tipo}</Text>
          <Insignia texto={examen.estado} color={colorEstadoValor[examen.estado] || colores.textoSuave} />
        </View>
        <Text style={s.detalle}>{formatoLargo(examen.fecha)}</Text>
        {examen.laboratorio ? <Text style={s.detalle}>{examen.laboratorio}</Text> : null}
        {examen.sensible ? (
          <Text style={s.sensible}>
            Examen marcado como sensible. Cada acceso queda registrado con IP en la auditoria.
          </Text>
        ) : null}
        <Boton titulo="Abrir archivo original" variante="secundario"
          style={{ marginTop: esp.md }} onPress={abrirArchivo} />
      </Tarjeta>

      <Tarjeta>
        <Text style={s.seccion}>
          {esPaciente ? 'Que significa tu examen' : 'Resumen clinico'}
        </Text>
        {resumen ? (
          <Text style={s.resumen}>{resumen}</Text>
        ) : (
          <Text style={s.pendiente}>
            El resumen se genera en segundo plano despues de la carga. Vuelve a entrar en unos segundos.
          </Text>
        )}
        {esMedico || esAdmin ? (
          <Boton titulo="Regenerar resumen" variante="fantasma" cargando={regenerando} onPress={regenerar} />
        ) : null}
      </Tarjeta>

      <Tarjeta>
        <Text style={s.seccion}>Valores extraidos</Text>
        {examen.valores.length === 0 ? (
          <Text style={s.pendiente}>Todavia no se extrajeron valores numericos de este examen.</Text>
        ) : (
          examen.valores.map((v) => (
            <View key={v.id || v.nombre} style={s.valor}>
              <View style={{ flex: 1 }}>
                <Text style={s.valorNombre}>{v.nombre}</Text>
                {v.referencia ? <Text style={s.detalle}>Referencia: {v.referencia}</Text> : null}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[s.valorNumero, { color: colorEstadoValor[v.estado] || colores.texto }]}>
                  {v.valor} {v.unidad}
                </Text>
                <Insignia texto={v.estado} color={colorEstadoValor[v.estado] || colores.textoSuave} />
              </View>
            </View>
          ))
        )}
      </Tarjeta>

      {esPaciente ? (
        <Text style={s.nota}>
          Este resumen es orientativo y no sustituye la interpretacion de tu medico.
        </Text>
      ) : null}
      <View style={{ height: esp.lg }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  fila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titulo: { fontWeight: '800', fontSize: 18, color: colores.texto, flex: 1 },
  seccion: { fontWeight: '800', fontSize: 16, marginBottom: esp.sm, color: colores.texto },
  detalle: { color: colores.textoSuave, fontSize: 13, marginTop: 2 },
  sensible: { color: colores.peligro, fontSize: 12, fontWeight: '700', marginTop: esp.sm },
  resumen: { color: colores.texto, fontSize: 15, lineHeight: 22 },
  pendiente: { color: colores.textoSuave, fontStyle: 'italic', fontSize: 13 },
  valor: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderTopWidth: 1, borderTopColor: colores.borde, paddingVertical: esp.sm
  },
  valorNombre: { color: colores.texto, fontWeight: '600' },
  valorNumero: { fontWeight: '800', fontSize: 16 },
  nota: { color: colores.textoSuave, fontSize: 12, textAlign: 'center', marginBottom: esp.md }
});
