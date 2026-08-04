const DIAS = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export function aISO(fecha) {
  const d = new Date(fecha);
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return d.getFullYear() + '-' + mes + '-' + dia;
}

export function hoyISO() {
  return aISO(new Date());
}

export function proximosDias(n = 21) {
  const salida = [];
  const hoy = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(hoy);
    d.setDate(d.getDate() + i);
    salida.push({ iso: aISO(d), diaCorto: DIAS[d.getDay()], numero: d.getDate(), mes: MESES[d.getMonth()] });
  }
  return salida;
}

export function horasDelDia(inicio = 8, fin = 19, pasoMin = 30) {
  const salida = [];
  for (let m = inicio * 60; m <= fin * 60; m += pasoMin) {
    salida.push(String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'));
  }
  return salida;
}

export function formatoLargo(iso) {
  if (!iso) return '';
  const d = new Date(String(iso).slice(0, 10) + 'T00:00:00');
  if (isNaN(d.getTime())) return String(iso);
  return DIAS[d.getDay()] + ' ' + d.getDate() + ' ' + MESES[d.getMonth()] + ' ' + d.getFullYear();
}

export function formatoHora(valor) {
  if (!valor) return '';
  const texto = String(valor);
  if (texto.length <= 5) return texto;
  const d = new Date(texto);
  if (isNaN(d.getTime())) return texto.slice(11, 16);
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

export function esFutura(fecha, hora) {
  const d = new Date(String(fecha).slice(0, 10) + 'T' + (hora || '00:00'));
  return isNaN(d.getTime()) ? true : d >= new Date();
}

export function dinero(monto) {
  const n = Number(monto || 0);
  return n.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
