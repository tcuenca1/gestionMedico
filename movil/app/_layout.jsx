import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ProveedorAuth, useAuth } from '../src/auth';
import { Cargando } from '../src/ui';
import { colores } from '../src/theme';

const PUBLICAS = ['login', 'index'];

function Guardia({ children }) {
  const { usuario, cargando } = useAuth();
  const segmentos = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (cargando) return;
    const raiz = segmentos[0] || 'index';
    const enPublica = PUBLICAS.includes(raiz);
    if (!usuario && !enPublica) router.replace('/login');
    if (usuario && enPublica) router.replace('/(app)/agenda');
  }, [usuario, cargando, segmentos]);

  if (cargando) return <Cargando />;
  return children;
}

export default function LayoutRaiz() {
  return (
    <SafeAreaProvider>
      <ProveedorAuth>
        <Guardia>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colores.tarjeta },
              headerTintColor: colores.texto,
              headerTitleStyle: { fontWeight: '700' },
              contentStyle: { backgroundColor: colores.fondo }
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="(app)" options={{ headerShown: false }} />
            <Stack.Screen name="cita/nueva" options={{ title: 'Nueva cita' }} />
            <Stack.Screen name="consulta/[idCita]" options={{ title: 'Registrar consulta' }} />
            <Stack.Screen name="paciente/[id]" options={{ title: 'Paciente' }} />
            <Stack.Screen name="examen/[id]" options={{ title: 'Examen' }} />
            <Stack.Screen name="examen/subir" options={{ title: 'Subir examen' }} />
            <Stack.Screen name="chat/[id]" options={{ title: 'Conversacion' }} />
            <Stack.Screen name="admin/medicos" options={{ title: 'Medicos' }} />
            <Stack.Screen name="admin/especialidades" options={{ title: 'Especialidades' }} />
            <Stack.Screen name="admin/reportes" options={{ title: 'Reporte de pagos' }} />
          </Stack>
        </Guardia>
      </ProveedorAuth>
    </SafeAreaProvider>
  );
}
