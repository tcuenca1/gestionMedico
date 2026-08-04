import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../src/auth';
import { Cargando } from '../src/ui';

export default function Inicio() {
  const { usuario, cargando } = useAuth();
  if (cargando) return <Cargando />;
  return <Redirect href={usuario ? '/(app)/agenda' : '/login'} />;
}
