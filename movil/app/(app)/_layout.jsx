import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/auth';
import { colores } from '../../src/theme';

/** Devuelve undefined si la pestana es visible, o null para ocultarla. */
const ver = (condicion) => (condicion ? undefined : null);

export default function LayoutTabs() {
  const { esAdmin, esRecepcion, esMedico, esPaciente } = useAuth();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colores.primario,
        tabBarInactiveTintColor: colores.textoSuave,
        headerStyle: { backgroundColor: colores.tarjeta },
        headerTitleStyle: { fontWeight: '700' }
      }}
    >
      <Tabs.Screen
        name="inicio"
        options={{
          title: 'Panel',
          href: ver(esAdmin),
          tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart" color={color} size={size} />
        }}
      />
      <Tabs.Screen
        name="agenda"
        options={{
          title: esPaciente ? 'Mis citas' : 'Agenda',
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar" color={color} size={size} />
        }}
      />
      <Tabs.Screen
        name="pacientes"
        options={{
          title: 'Pacientes',
          href: ver(esAdmin || esRecepcion || esMedico),
          tabBarIcon: ({ color, size }) => <Ionicons name="people" color={color} size={size} />
        }}
      />
      <Tabs.Screen
        name="pagos"
        options={{
          title: 'Pagos',
          href: ver(esRecepcion),
          tabBarIcon: ({ color, size }) => <Ionicons name="cash" color={color} size={size} />
        }}
      />
      <Tabs.Screen
        name="examenes"
        options={{
          title: 'Mis examenes',
          href: ver(esPaciente),
          tabBarIcon: ({ color, size }) => <Ionicons name="flask" color={color} size={size} />
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          href: ver(!esPaciente),
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles" color={color} size={size} />
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-circle" color={color} size={size} />
        }}
      />
    </Tabs>
  );
}
