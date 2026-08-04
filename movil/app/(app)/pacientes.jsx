import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { api } from '../../src/api';
import { useAuth } from '../../src/auth';
import { Aviso, Campo, Cargando, Tarjeta, Vacio } from '../../src/ui';
import { colores, esp } from '../../src/theme';

/**
 * Listado de pacientes. Con 3 o mas caracteres usa GET /api/pacientes/buscar/:term,
 * que consulta con ILIKE contra DNI, Nombres, Apellidos e ID_Paciente (LIMIT 20).
 */
export default function Pacientes() {
  const router = useRouter();
  const { esAdmin, esRecepcion } = useAuth();
  const [pacientes, setPacientes] = useState([]);
  const [termino, setTermino] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargarTodos = useCallback(async () => {
    setError('');
    try {
      setPacientes(await api.pacientes());
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { if (!termino) cargarTodos(); }, [cargarTodos, termino]));

  useEffect(() => {
    if (termino.trim().length < 3) return;
    const t = setTimeout(async () => {
      try {
        setPacientes(await api.buscarPacientes(termino.trim()));
      } catch (e) {
        setError(e.message);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [termino]);

  if (cargando) return <Cargando />;

  return (
    <View style={{ flex: 1, backgroundColor: colores.fondo }}>
      <View style={{ padding: esp.md, paddingBottom: 0 }}>
        <Aviso mensaje={error} />
        <Campo
          placeholder="Buscar por DNI, nombre o apellido"
          value={termino}
          onChangeText={setTermino}
          autoCapitalize="none"
        />
      </View>
      <FlatList
        data={pacientes}
        keyExtractor={(p) => String(p.id)}
        contentContainerStyle={{ padding: esp.md, paddingTop: 0 }}
        ListEmptyComponent={<Vacio texto="No hay pacientes que coincidan." />}
        renderItem={({ item }) => (
          <Tarjeta onPress={() => router.push('/paciente/' + item.id)}>
            <Text style={s.nombre}>{item.nombreCompleto}</Text>
            <Text style={s.detalle}>DNI {item.dni || 'N/D'}</Text>
            <Text style={s.detalle}>
              {item.telefono || 'Sin telefono'} - {item.correo || 'Sin correo'}
            </Text>
          </Tarjeta>
        )}
      />
      {esAdmin || esRecepcion ? (
        <Text style={s.nota}>
          El alta de pacientes crea tambien su usuario, con el DNI como contrasena inicial.
        </Text>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  nombre: { fontWeight: '700', fontSize: 16, color: colores.texto },
  detalle: { color: colores.textoSuave, fontSize: 13, marginTop: 2 },
  nota: { color: colores.textoSuave, fontSize: 11, textAlign: 'center', padding: esp.sm }
});
