import express from 'express';
import pool from '../db';
import { authenticateToken } from '../middleware/auth';
import { normalizeRow, normalizeRows } from '../utils/normalize-rows';

const router = express.Router();

router.get('/', authenticateToken, async (req: any, res: any) => {
  try {
    const result = await pool.query(
      `SELECT p.*, c.ID_Cita, cm.ID_Consulta,
             pac.Nombres || ' ' || pac.Apellidos AS Paciente_Nombre
       FROM Pago p
       JOIN Consulta_Medica cm ON p.ID_Consulta = cm.ID_Consulta
       JOIN Cita c ON cm.ID_Cita = c.ID_Cita
       JOIN Paciente pac ON c.ID_Paciente = pac.ID_Paciente
       ORDER BY p.Fecha_Pago DESC`,
    );
    res.json(normalizeRows(result.rows));
  } catch (error) {
    console.error('Error al obtener pagos:', error);
    res.status(500).json({ message: 'Error al obtener pagos' });
  }
});

router.get('/reporte', authenticateToken, async (req: any, res: any) => {
  try {
    const { inicio, fin } = req.query;
    if (!inicio || !fin) {
      return res.status(400).json({ message: 'Las fechas de inicio y fin son requeridas' });
    }

    const result = await pool.query(
      `SELECT p.*, c.ID_Cita, cm.ID_Consulta,
             pac.Nombres || ' ' || pac.Apellidos AS Paciente_Nombre
       FROM Pago p
       JOIN Consulta_Medica cm ON p.ID_Consulta = cm.ID_Consulta
       JOIN Cita c ON cm.ID_Cita = c.ID_Cita
       JOIN Paciente pac ON c.ID_Paciente = pac.ID_Paciente
       WHERE DATE(p.Fecha_Pago) >= $1 AND DATE(p.Fecha_Pago) <= $2
       ORDER BY p.Fecha_Pago DESC`,
      [inicio, fin]
    );
    res.json(normalizeRows(result.rows));
  } catch (error) {
    console.error('Error al generar reporte de pagos:', error);
    res.status(500).json({ message: 'Error al generar el reporte de pagos' });
  }
});

router.post('/', authenticateToken, async (req: any, res: any) => {
  try {
    const { ID_Consulta, Monto } = req.body;
    if (!ID_Consulta || !Monto) {
      return res.status(400).json({ message: 'Consulta y monto son requeridos' });
    }

    const result = await pool.query(
      `INSERT INTO Pago (ID_Consulta, Monto, Estado_Pago) VALUES ($1, $2, 'Completado') RETURNING *`,
      [ID_Consulta, Monto],
    );
    res.status(201).json(normalizeRow(result.rows[0]));
  } catch (error) {
    console.error('Error al registrar pago:', error);
    res.status(500).json({ message: 'Error al registrar el pago' });
  }
});

router.put('/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { Estado_Pago } = req.body;

    const result = await pool.query(
      `UPDATE Pago SET Estado_Pago = $1 WHERE ID_Pago = $2 RETURNING *`,
      [Estado_Pago || 'Anulado', id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Pago no encontrado' });
    }

    res.json(normalizeRow(result.rows[0]));
  } catch (error) {
    console.error('Error al actualizar pago:', error);
    res.status(500).json({ message: 'Error al actualizar el pago' });
  }
});

export default router;
