import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colores, esp, radio } from './theme';

export function Tarjeta({ children, style, onPress }) {
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [e.tarjeta, pressed && { opacity: 0.85 }, style]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[e.tarjeta, style]}>{children}</View>;
}

export function Boton({ titulo, onPress, variante = 'primario', cargando, deshabilitado, style }) {
  const inactivo = deshabilitado || cargando;
  const paleta = {
    primario: { fondo: colores.primario, texto: '#fff' },
    secundario: { fondo: colores.primarioSuave, texto: colores.primario },
    peligro: { fondo: '#FEE2E2', texto: colores.peligro },
    fantasma: { fondo: 'transparent', texto: colores.primario }
  }[variante];

  return (
    <Pressable
      onPress={inactivo ? undefined : onPress}
      style={({ pressed }) => [
        e.boton,
        { backgroundColor: paleta.fondo, opacity: inactivo ? 0.5 : pressed ? 0.85 : 1 },
        style
      ]}
    >
      {cargando ? (
        <ActivityIndicator color={paleta.texto} />
      ) : (
        <Text style={[e.botonTexto, { color: paleta.texto }]}>{titulo}</Text>
      )}
    </Pressable>
  );
}

export function Campo({ etiqueta, style, ...props }) {
  return (
    <View style={[{ marginBottom: esp.md }, style]}>
      {etiqueta ? <Text style={e.etiqueta}>{etiqueta}</Text> : null}
      <TextInput placeholderTextColor={colores.textoSuave} style={e.input} {...props} />
    </View>
  );
}

export function Insignia({ texto, color }) {
  const c = color || colores.primario;
  return (
    <View style={[e.insignia, { backgroundColor: c + '22' }]}>
      <Text style={[e.insigniaTexto, { color: c }]}>{texto}</Text>
    </View>
  );
}

export function Chip({ texto, activo, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={[e.chip, activo && { backgroundColor: colores.primario, borderColor: colores.primario }]}
    >
      <Text style={[e.chipTexto, activo && { color: '#fff' }]}>{texto}</Text>
    </Pressable>
  );
}

export function Vacio({ texto }) {
  return (
    <View style={{ padding: esp.xl, alignItems: 'center' }}>
      <Text style={{ color: colores.textoSuave, textAlign: 'center' }}>{texto}</Text>
    </View>
  );
}

export function Cargando() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colores.fondo }}>
      <ActivityIndicator size="large" color={colores.primario} />
    </View>
  );
}

export function Aviso({ mensaje, tono = 'error' }) {
  if (!mensaje) return null;
  const paleta = {
    error: { fondo: '#FEE2E2', texto: colores.peligro },
    exito: { fondo: '#DCFCE7', texto: colores.exito },
    info: { fondo: colores.primarioSuave, texto: colores.primario }
  }[tono];
  return (
    <View style={[e.aviso, { backgroundColor: paleta.fondo }]}>
      <Text style={{ color: paleta.texto }}>{mensaje}</Text>
    </View>
  );
}

export function Dato({ titulo, valor }) {
  if (valor === undefined || valor === null || valor === '') return null;
  return (
    <View style={{ marginTop: esp.sm }}>
      <Text style={e.datoTitulo}>{titulo}</Text>
      <Text style={e.datoValor}>{String(valor)}</Text>
    </View>
  );
}

export function Metrica({ titulo, valor, color }) {
  return (
    <View style={e.metrica}>
      <Text style={[e.metricaValor, color && { color }]}>{valor}</Text>
      <Text style={e.metricaTitulo}>{titulo}</Text>
    </View>
  );
}

const e = StyleSheet.create({
  tarjeta: {
    backgroundColor: colores.tarjeta, borderRadius: radio, padding: esp.md,
    marginBottom: esp.md, borderWidth: 1, borderColor: colores.borde
  },
  boton: {
    paddingVertical: 14, paddingHorizontal: esp.md, borderRadius: radio,
    alignItems: 'center', justifyContent: 'center'
  },
  botonTexto: { fontWeight: '700', fontSize: 15 },
  etiqueta: { color: colores.textoSuave, marginBottom: 6, fontSize: 13, fontWeight: '600' },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: colores.borde, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 12, color: colores.texto, fontSize: 15
  },
  insignia: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, alignSelf: 'flex-start' },
  insigniaTexto: { fontSize: 12, fontWeight: '700' },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1,
    borderColor: colores.borde, backgroundColor: '#fff', marginRight: esp.sm, marginBottom: esp.sm
  },
  chipTexto: { color: colores.texto, fontSize: 13, fontWeight: '600' },
  aviso: { padding: esp.sm + 2, borderRadius: 10, marginBottom: esp.md },
  datoTitulo: { color: colores.textoSuave, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  datoValor: { color: colores.texto, fontSize: 14 },
  metrica: {
    flex: 1, minWidth: 140, backgroundColor: colores.tarjeta, borderRadius: radio,
    borderWidth: 1, borderColor: colores.borde, padding: esp.md, margin: esp.xs
  },
  metricaValor: { fontSize: 26, fontWeight: '800', color: colores.primario },
  metricaTitulo: { color: colores.textoSuave, fontSize: 12, fontWeight: '600' }
});
