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

export default router;
