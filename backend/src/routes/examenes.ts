import express from 'express';
import pool from '../db';
import { authenticateToken } from '../middleware/auth';
import { normalizeRow, normalizeRows } from '../utils/normalize-rows';

const router = express.Router();

router.get('/paciente/:idPaciente', authenticateToken, async (req: any, res: any) => {
  try {
    const { idPaciente } = req.params;
    const result = await pool.query(
      `SELECT ex.*, p.Nombres || ' ' || p.Apellidos AS Paciente_Nombre
       FROM Examen ex JOIN Paciente p ON ex.ID_Paciente = p.ID_Paciente
       WHERE ex.ID_Paciente = $1 ORDER BY ex.Fecha_Subida DESC`,
      [idPaciente],
    );
    res.json(normalizeRows(result.rows));
  } catch (error) {
    console.error('Error al obtener exámenes:', error);
    res.status(500).json({ message: 'Error al obtener exámenes' });
  }
});

export default router;
