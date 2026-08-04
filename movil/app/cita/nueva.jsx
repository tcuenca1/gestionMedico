import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../../src/api';
import { useAuth } from '../../src/auth';
import { Aviso, Boton, Campo, Cargando, Chip, Tarjeta } from '../../src/ui';
import { colores, esp } from '../../src/theme';
import { formatoLargo, horasDelDia, proximosDias } from '../../src/fechas';

/**
 * Alta de cita (POST /api/citas).
 *
 * El backend detecta conflictos: si el medico ya tiene una cita dentro de los
 * 30 minutos siguientes, reprograma automaticamente sumando 30 min (hasta 10
 * intentos) y devuelve Ajustado: true. Aqui se avisa al usuario si eso ocurre.
 */
export default function NuevaCita() {
  const router = useRouter();
  const { usuario, esPaciente } = useAuth();

  const [medicos, setMedicos] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [especialidad, setEspecialidad] = useState('');
  const [idMedico, setIdMedico] = useState(null);

  const [pacientes, setPacientes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [idPaciente, setIdPaciente] = useState(esPaciente ? usuario?.idPaciente : null);
  const [nombrePaciente, setNombrePaciente] = useState(esPaciente ? 'Tu ficha' : '');

  const [fecha, setFecha] = useState(null);
  const [hora, setHora] = useState(null);
  const [motivo, setMotivo] = useState('');

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const dias = proximosDias(21);
  const horas = horasDelDia(8, 19, 30);

  useEffect(() => {
    (async () => {
      try {
        const [ms, es] = await Promise.all([api.medicos(), api.especialidades()]);
        setMedicos(ms);
        setEspecialidades(es);
      } catch (e) {
        setError(e.message);
      } finally {
        setCargando(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (esPaciente || busqueda.trim().length < 3) return;
    const t = setTimeout(async () => {
      try {
        setPacientes(await api.buscarPacientes(busqueda.trim()));
      } catch (e) {
        setError(e.message);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [busqueda, esPaciente]);

  const medicosVisibles = especialidad
    ? medicos.filter((m) => m.especialidad === especialidad)
    : medicos;

  async function confirmar() {
    setError('');
    if (!idPaciente) return setError('Selecciona el paciente.');
    if (!idMedico) return setError('Selecciona el medico.');
    if (!fecha || !hora) return setError('Selecciona la fecha y la hora.');

    setGuardando(true);
    try {
      const cita = await api.crearCita({
        ID_Paciente: idPaciente,
        ID_Medico: idMedico,
        Fecha_Hora: fecha + 'T' + hora + ':00',
        Fecha: fecha,
        Hora: hora,
        Motivo: motivo,
        Estado: 'Pendiente'
      });
      const mensaje = cita.ajustado
        ? 'Habia un conflicto de horario. El sistema reprogramo la cita para el ' +
          formatoLargo(cita.fecha) + ' a las ' + cita.hora + '.'
        : 'Cita registrada para el ' + formatoLargo(fecha) + ' a las ' + hora + '.';
      Alert.alert('Cita creada', mensaje, [
        { text: 'Ver agenda', onPress: () => router.replace('/(app)/agenda') }
      ]);
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) return <Cargando />;

  return (
    <ScrollView style={{ backgroundColor: colores.fondo }} contentContainerStyle={{ padding: esp.md }}>
      <Aviso mensaje={error} />

      {!esPaciente ? (
        <Tarjeta>
          <Text style={s.paso}>1. Paciente</Text>
          {idPaciente ? (
            <View style={s.seleccion}>
              <Text style={s.seleccionTexto}>{nombrePaciente}</Text>
              <Boton titulo="Cambiar" variante="fantasma" onPress={() => { setIdPaciente(null); setNombrePaciente(''); }} />
            </View>
          ) : (
            <>
              <Campo
                placeholder="Buscar por DNI, nombre o apellido"
                value={busqueda}
                onChangeText={setBusqueda}
                autoCapitalize="none"
              />
              {pacientes.map((p) => (
                <Chip
                  key={p.id}
                  texto={p.nombreCompleto + ' - ' + p.dni}
                  activo={idPaciente === p.id}
                  onPress={() => { setIdPaciente(p.id); setNombrePaciente(p.nombreCompleto); }}
                />
              ))}
              {busqueda.trim().length > 0 && busqueda.trim().length < 3 ? (
                <Text style={s.ayuda}>Escribe al menos 3 caracteres.</Text>
              ) : null}
            </>
          )}
        </Tarjeta>
      ) : null}

      <Tarjeta>
        <Text style={s.paso}>{esPaciente ? '1' : '2'}. Especialidad y medico</Text>
        <View style={s.envoltura}>
          <Chip texto="Todas" activo={!especialidad} onPress={() => setEspecialidad('')} />
          {especialidades.map((e2) => (
            <Chip key={e2.id} texto={e2.nombre} activo={especialidad === e2.nombre}
              onPress={() => { setEspecialidad(e2.nombre); setIdMedico(null); }} />
          ))}
        </View>
        <View style={[s.envoltura, { marginTop: esp.sm }]}>
          {medicosVisibles.map((m) => (
            <Chip key={m.id} texto={'Dr(a). ' + m.nombreCompleto} activo={idMedico === m.id}
              onPress={() => setIdMedico(m.id)} />
          ))}
        </View>
      </Tarjeta>

      <Tarjeta>
        <Text style={s.paso}>{esPaciente ? '2' : '3'}. Dia</Text>
        <View style={s.envoltura}>
          {dias.map((d) => (
            <Chip key={d.iso} texto={d.diaCorto + ' ' + d.numero + ' ' + d.mes} activo={fecha === d.iso}
              onPress={() => setFecha(d.iso)} />
          ))}
        </View>
      </Tarjeta>

      <Tarjeta>
        <Text style={s.paso}>{esPaciente ? '3' : '4'}. Hora</Text>
        <View style={s.envoltura}>
          {horas.map((h) => (
            <Chip key={h} texto={h} activo={hora === h} onPress={() => setHora(h)} />
          ))}
        </View>
        <Text style={s.ayuda}>
          Si el horario esta ocupado, el servidor reprograma automaticamente al siguiente bloque libre.
        </Text>
      </Tarjeta>

      <Tarjeta>
        <Text style={s.paso}>{esPaciente ? '4' : '5'}. Motivo</Text>
        <Campo placeholder="Motivo de la consulta" value={motivo} onChangeText={setMotivo} multiline />
      </Tarjeta>

      <Boton titulo="Crear cita" onPress={confirmar} cargando={guardando} />
      <View style={{ height: esp.xl }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  paso: { fontWeight: '800', marginBottom: esp.sm, color: colores.texto },
  envoltura: { flexDirection: 'row', flexWrap: 'wrap' },
  ayuda: { color: colores.textoSuave, fontSize: 12, marginTop: esp.xs },
  seleccion: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  seleccionTexto: { color: colores.texto, fontWeight: '600', flex: 1 }
});
