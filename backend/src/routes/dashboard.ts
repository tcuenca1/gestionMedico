import express from 'express';
import pool from '../db';
import { authenticateToken } from '../middleware/auth';
import { normalizeRow, normalizeRows } from '../utils/normalize-rows';

const router = express.Router();

router.get('/stats', authenticateToken, async (req: any, res: any) => {
  try {
    const { fecha } = req.query;
    const fechaFiltro = fecha || new Date().toISOString().split('T')[0];

    const medicosCount = await pool.query('SELECT COUNT(*) FROM Medico');
    const pacientesCount = await pool.query('SELECT COUNT(*) FROM Paciente');
    const especialidadesCount = await pool.query('SELECT COUNT(*) FROM Especialidad');

    const citasHoyRes = await pool.query(
      `SELECT COUNT(*) FROM Cita WHERE DATE(Fecha_Hora) = $1`,
      [fechaFiltro]
    );

    const citasPendientesRes = await pool.query(
      `SELECT COUNT(*) FROM Cita WHERE Estado = 'Pendiente'`
    );

    const citasAtendidasRes = await pool.query(
      `SELECT COUNT(*) FROM Cita WHERE DATE(Fecha_Hora) = $1 AND Estado = 'Atendida'`,
      [fechaFiltro]
    );

    const ingresosHoyRes = await pool.query(
      `SELECT SUM(Monto) AS total FROM Pago WHERE DATE(Fecha_Pago) = $1 AND Estado_Pago = 'Completado'`,
      [fechaFiltro]
    );

    const ingresosTotalesRes = await pool.query(
      `SELECT SUM(Monto) AS total FROM Pago WHERE Estado_Pago = 'Completado'`
    );

    res.json({
      medicos: Number(medicosCount.rows[0].count),
      pacientes: Number(pacientesCount.rows[0].count),
      especialidades: Number(especialidadesCount.rows[0].count),
      citasHoy: Number(citasHoyRes.rows[0].count),
      citasPendientes: Number(citasPendientesRes.rows[0].count),
      citasAtendidas: Number(citasAtendidasRes.rows[0].count),
      ingresosHoy: Number(ingresosHoyRes.rows[0].total) || 0,
      ingresosTotales: Number(ingresosTotalesRes.rows[0].total) || 0,
    });
  } catch (error) {
    console.error('Error al obtener estadísticas de dashboard:', error);
    res.status(500).json({ message: 'Error al obtener dashboard' });
  }
});

router.get('/admin', authenticateToken, async (req: any, res: any) => {
  try {
    const medicosCount = await pool.query('SELECT COUNT(*) FROM Medico');
    const pacientesCount = await pool.query('SELECT COUNT(*) FROM Paciente');
    const citasCount = await pool.query("SELECT COUNT(*) FROM Cita WHERE Estado = 'Pendiente'");
    const ingresosSum = await pool.query("SELECT SUM(Monto) AS total FROM Pago WHERE Estado_Pago = 'Completado'");

    res.json({
      medicos: Number(medicosCount.rows[0].count),
      pacientes: Number(pacientesCount.rows[0].count),
      citasPendientes: Number(citasCount.rows[0].count),
      ingresosTotales: Number(ingresosSum.rows[0].total) || 0,
    });
  } catch (error) {
    console.error('Error al obtener estadísticas de admin:', error);
    res.status(500).json({ message: 'Error al obtener dashboard' });
  }
});

export default router;
