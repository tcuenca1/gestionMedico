import React, { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { api } from '../../src/api';
import { Aviso, Boton, Campo, Tarjeta } from '../../src/ui';
import { colores, esp, radio } from '../../src/theme';

/**
 * Carga de examen (POST /api/examenes/upload, multipart, max 20 MB, PDF/JPG/PNG).
 * Tras la subida el servidor ejecuta OCR, clasificacion, extraccion de valores
 * y generacion de resumenes con IA en segundo plano.
 */
export default function SubirExamen() {
  const { idPaciente } = useLocalSearchParams();
  const router = useRouter();

  const [archivo, setArchivo] = useState(null);
  const [laboratorio, setLaboratorio] = useState('');
  const [tipo, setTipo] = useState('');
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState('');

  async function tomarFoto() {
    const permiso = await ImagePicker.requestCameraPermissionsAsync();
    if (!permiso.granted) return setError('Se necesita permiso de camara.');
    const r = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!r.canceled) usarImagen(r.assets[0]);
  }

  async function elegirImagen() {
    const r = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
    if (!r.canceled) usarImagen(r.assets[0]);
  }

  function usarImagen(activo) {
    setArchivo({
      uri: activo.uri,
      name: activo.fileName || 'examen_' + Date.now() + '.jpg',
      type: activo.mimeType || 'image/jpeg',
      esImagen: true
    });
  }

  async function elegirPdf() {
    const r = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
    if (r.canceled) return;
    const a = r.assets[0];
    setArchivo({ uri: a.uri, name: a.name, type: a.mimeType || 'application/pdf', esImagen: false });
  }

  async function subir() {
    setError('');
    if (!archivo) return setError('Selecciona una foto o un PDF del examen.');
    if (!idPaciente) return setError('Falta el paciente asociado al examen.');

    setSubiendo(true);
    try {
      await api.subirExamen(idPaciente, archivo, { Laboratorio: laboratorio, Tipo: tipo });
      Alert.alert(
        'Examen cargado',
        'El servidor esta procesando el OCR y generando los resumenes. Puede tardar unos segundos.',
        [{ text: 'Entendido', onPress: () => router.back() }]
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setSubiendo(false);
    }
  }

  return (
    <ScrollView style={{ backgroundColor: colores.fondo }} contentContainerStyle={{ padding: esp.md }}>
      <Aviso mensaje={error} />

      <Tarjeta>
        <Text style={s.seccion}>Archivo</Text>
        {archivo ? (
          <View style={{ marginBottom: esp.md }}>
            {archivo.esImagen ? (
              <Image source={{ uri: archivo.uri }} style={s.previa} resizeMode="cover" />
            ) : (
              <Text style={s.nombreArchivo}>{archivo.name}</Text>
            )}
            <Boton titulo="Quitar" variante="fantasma" onPress={() => setArchivo(null)} />
          </View>
        ) : null}

        <Boton titulo="Tomar foto" onPress={tomarFoto} style={{ marginBottom: esp.sm }} />
        <Boton titulo="Elegir de la galeria" variante="secundario" onPress={elegirImagen} style={{ marginBottom: esp.sm }} />
        <Boton titulo="Elegir PDF" variante="secundario" onPress={elegirPdf} />
        <Text style={s.ayuda}>Formatos aceptados: PDF, JPG y PNG. Maximo 20 MB.</Text>
      </Tarjeta>

      <Tarjeta>
        <Text style={s.seccion}>Datos opcionales</Text>
        <Campo etiqueta="Laboratorio" value={laboratorio} onChangeText={setLaboratorio} />
        <Campo etiqueta="Tipo de examen" placeholder="Se detecta solo si lo dejas vacio"
          value={tipo} onChangeText={setTipo} />
      </Tarjeta>

      <Boton titulo="Subir examen" onPress={subir} cargando={subiendo} />
      <View style={{ height: esp.xl }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  seccion: { fontWeight: '800', fontSize: 16, marginBottom: esp.md, color: colores.texto },
  previa: { width: '100%', height: 220, borderRadius: radio, marginBottom: esp.sm },
  nombreArchivo: { color: colores.texto, fontWeight: '600', marginBottom: esp.sm },
  ayuda: { color: colores.textoSuave, fontSize: 12, marginTop: esp.sm, textAlign: 'center' }
});
