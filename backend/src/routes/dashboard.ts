import express from 'express';
import pool from '../db';
import { authenticateToken } from '../middleware/auth';
import { normalizeRow, normalizeRows } from '../utils/normalize-rows';

const router = express.Router();

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
