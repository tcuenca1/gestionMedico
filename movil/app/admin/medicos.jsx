import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Modal, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { api } from '../../src/api';
import { Aviso, Boton, Campo, Cargando, Chip, Tarjeta, Vacio } from '../../src/ui';
import { colores, esp } from '../../src/theme';

const VACIO = {
  Nombres: '', Apellidos: '', Colegiatura: '', Telefono: '',
  ID_Especialidad: null, Username: '', Password: ''
};

/**
 * ABM de medicos (solo administrador).
 * El alta crea tambien el Usuario con rol Medico; el borrado es logico
 * (Estado_Activo = false) y reactiva al usuario si ya existia inactivo.
 */
export default function AdminMedicos() {
  const [medicos, setMedicos] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [modal, setModal] = useState(false);
  const [f, setF] = useState(VACIO);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }));

  const cargar = useCallback(async () => {
    setError('');
    try {
      const [ms, es] = await Promise.all([api.medicos(), api.especialidades()]);
      setMedicos(ms);
      setEspecialidades(es);
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  async function crear() {
    setError('');
    if (!f.Nombres || !f.Apellidos) return setError('Nombres y apellidos son obligatorios.');
    if (!f.ID_Especialidad) return setError('Selecciona una especialidad.');
    if (!f.Username || !f.Password) return setError('El usuario y la contrasena son obligatorios.');
    setGuardando(true);
    try {
      await api.crearMedico(f);
      setModal(false);
      setF(VACIO);
      await cargar();
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  }

  function pedirBaja(medico) {
    Alert.alert(
      'Desactivar medico',
      'Se desactivara el usuario de ' + medico.nombreCompleto + '. Los registros historicos se conservan.',
      [
        { text: 'Volver', style: 'cancel' },
        {
          text: 'Desactivar',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.desactivarMedico(medico.id);
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
      <FlatList
        data={medicos}
        keyExtractor={(m) => String(m.id)}
        contentContainerStyle={{ padding: esp.md, paddingBottom: 96 }}
        ListHeaderComponent={<Aviso mensaje={error} />}
        ListEmptyComponent={<Vacio texto="No hay medicos registrados." />}
        renderItem={({ item }) => (
          <Tarjeta>
            <Text style={s.nombre}>Dr(a). {item.nombreCompleto}</Text>
            <Text style={s.detalle}>{item.especialidad || 'Sin especialidad'}</Text>
            <Text style={s.detalle}>Colegiatura {item.colegiatura || 'N/D'}</Text>
            <Boton titulo="Desactivar" variante="peligro" style={{ marginTop: esp.md }}
              onPress={() => pedirBaja(item)} />
          </Tarjeta>
        )}
      />

      <View style={s.flotante}>
        <Boton titulo="+ Nuevo medico" onPress={() => setModal(true)} />
      </View>

      <Modal visible={modal} animationType="slide" onRequestClose={() => setModal(false)}>
        <ScrollView style={{ backgroundColor: colores.fondo }} contentContainerStyle={{ padding: esp.md, paddingTop: 60 }}>
          <Text style={s.modalTitulo}>Nuevo medico</Text>
          <Aviso mensaje={error} />
          <Tarjeta>
            <Campo etiqueta="Nombres" value={f.Nombres} onChangeText={set('Nombres')} />
            <Campo etiqueta="Apellidos" value={f.Apellidos} onChangeText={set('Apellidos')} />
            <Campo etiqueta="Colegiatura" value={f.Colegiatura} onChangeText={set('Colegiatura')} />
            <Campo etiqueta="Telefono" value={f.Telefono} onChangeText={set('Telefono')} keyboardType="phone-pad" />

            <Text style={s.etiqueta}>Especialidad</Text>
            <View style={s.envoltura}>
              {especialidades.map((e2) => (
                <Chip key={e2.id} texto={e2.nombre} activo={f.ID_Especialidad === e2.id}
                  onPress={() => set('ID_Especialidad')(e2.id)} />
              ))}
            </View>

            <Campo etiqueta="Usuario" value={f.Username} onChangeText={set('Username')} autoCapitalize="none" />
            <Campo etiqueta="Contrasena inicial" value={f.Password} onChangeText={set('Password')} secureTextEntry />
          </Tarjeta>
          <Boton titulo="Crear medico" onPress={crear} cargando={guardando} />
          <Boton titulo="Cancelar" variante="fantasma" onPress={() => setModal(false)} />
        </ScrollView>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  nombre: { fontWeight: '700', fontSize: 16, color: colores.texto },
  detalle: { color: colores.textoSuave, fontSize: 13, marginTop: 2 },
  etiqueta: { color: colores.textoSuave, marginBottom: 6, fontSize: 13, fontWeight: '600' },
  envoltura: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: esp.md },
  modalTitulo: { fontWeight: '800', fontSize: 20, color: colores.texto, marginBottom: esp.md },
  flotante: { position: 'absolute', left: esp.md, right: esp.md, bottom: esp.md }
});
