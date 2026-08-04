import express from 'express';
import pool from '../db';
import { authenticateToken } from '../middleware/auth';
import { normalizeRow, normalizeRows } from '../utils/normalize-rows';

const router = express.Router();

router.get('/:idCita', authenticateToken, async (req: any, res: any) => {
  try {
    const { idCita } = req.params;
    const citaRes = await pool.query(
      `SELECT c.*, p.Nombres AS Paciente_Nombres, p.Apellidos AS Paciente_Apellidos, p.DNI AS Paciente_DNI, p.Fecha_Nacimiento AS Paciente_Fecha_Nacimiento
       FROM Cita c JOIN Paciente p ON c.ID_Paciente = p.ID_Paciente WHERE c.ID_Cita = $1`,
      [idCita],
    );
    if (citaRes.rows.length === 0) return res.status(404).json({ message: 'Cita no encontrada' });

    const consultaRes = await pool.query('SELECT * FROM Consulta_Medica WHERE ID_Cita = $1', [idCita]);
    let consulta: any = consultaRes.rows[0] ? normalizeRow(consultaRes.rows[0]) : null;

    let signos: any = null;
    let receta: any[] = [];
    if (consulta) {
      const sRes = await pool.query('SELECT * FROM Signos_Vitales WHERE ID_Consulta = $1', [consulta.Id_Consulta]);
      if (sRes.rows.length > 0) signos = normalizeRow(sRes.rows[0]);

      const rRes = await pool.query('SELECT * FROM Receta_Medicamento WHERE ID_Consulta = $1', [consulta.Id_Consulta]);
      receta = normalizeRows(rRes.rows);
    }

    res.json({
      cita: normalizeRow(citaRes.rows[0]),
      consulta,
      signos,
      receta,
    });
  } catch (error) {
    console.error('Error al obtener detalles de consulta:', error);
    res.status(500).json({ message: 'Error al obtener consulta' });
  }
});

router.post('/', authenticateToken, async (req: any, res: any) => {
  const client = await pool.connect();
  try {
    const { ID_Cita, Motivo, Sintomas, Diagnostico_Notas, Tratamiento, Observaciones, Signos_Vitales: sv, Receta } = req.body;

    if (!ID_Cita || !Motivo || !Diagnostico_Notas) {
      return res.status(400).json({ message: 'Cita, motivo y diagnóstico son obligatorios' });
    }

    await client.query('BEGIN');

    const consultaRes = await client.query(
      `INSERT INTO Consulta_Medica (ID_Cita, Motivo, Sintomas, Diagnostico_Notas, Tratamiento, Observaciones)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [ID_Cita, Motivo, Sintomas || '', Diagnostico_Notas, Tratamiento || '', Observaciones || ''],
    );
    const consulta = consultaRes.rows[0];

    if (sv) {
      await client.query(
        `INSERT INTO Signos_Vitales (ID_Consulta, Presion_Arterial, Frecuencia_Cardiaca, Temperatura, Peso, Estatura, Frecuencia_Respiratoria, Saturacion_Oxigeno)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          consulta.id_consulta,
          sv.Presion_Arterial || null,
          sv.Frecuencia_Cardiaca || null,
          sv.Temperatura || null,
          sv.Peso || null,
          sv.Estatura || null,
          sv.Frecuencia_Respiratoria || null,
          sv.Saturacion_Oxigeno || null,
        ],
      );
    }

    if (Receta && Array.isArray(Receta)) {
      for (const item of Receta) {
        if (item.Medicamento && item.Dosis && item.Frecuencia) {
          await client.query(
            `INSERT INTO Receta_Medicamento (ID_Consulta, Medicamento, Dosis, Frecuencia, Duracion)
             VALUES ($1, $2, $3, $4, $5)`,
            [consulta.id_consulta, item.Medicamento, item.Dosis, item.Frecuencia, item.Duracion || ''],
          );
        }
      }
    }

    await client.query(`UPDATE Cita SET Estado = 'Atendida' WHERE ID_Cita = $1`, [ID_Cita]);

    await client.query('COMMIT');
    res.status(201).json(normalizeRow(consulta));
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al registrar consulta:', error);
    res.status(500).json({ message: 'Error al registrar la consulta médica' });
  } finally {
    client.release();
  }
});

export default router;
