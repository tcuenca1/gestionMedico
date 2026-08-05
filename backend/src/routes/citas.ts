import express from 'express';
import pool from '../db';
import { authenticateToken } from '../middleware/auth';
import { normalizeRow, normalizeRows } from '../utils/normalize-rows';
import { emitirNotificacionSistema } from '../utils/chat-notify';

const router = express.Router();

router.get('/', authenticateToken, async (req: any, res: any) => {
  try {
    let { medico_id, paciente_id, estado, fecha_desde, fecha_hasta } = req.query;
    
    if (!medico_id && req.user && req.user.rol === 'Médico') {
      const medRes = await pool.query('SELECT ID_Medico FROM Medico WHERE ID_Usuario = $1', [req.user.id]);
      if (medRes.rows.length > 0) {
        medico_id = medRes.rows[0].id_medico;
      }
    }

    let query = `
      SELECT c.*,
             p.Nombres AS Paciente_Nombres, p.Apellidos AS Paciente_Apellidos,
             (p.Nombres || ' ' || p.Apellidos) AS Paciente_Nombre,
             m.Nombres AS Medico_Nombres, m.Apellidos AS Medico_Apellidos,
             (m.Nombres || ' ' || m.Apellidos) AS Medico_Nombre,
             e.Nombre_Especialidad AS Especialidad
      FROM Cita c
      JOIN Paciente p ON c.ID_Paciente = p.ID_Paciente
      JOIN Medico m ON c.ID_Medico = m.ID_Medico
      JOIN Especialidad e ON m.ID_Especialidad = e.ID_Especialidad
      WHERE 1=1
    `;
    const params: any[] = [];
    let idx = 1;

    if (medico_id) {
      query += ` AND c.ID_Medico = $${idx++}`;
      params.push(medico_id);
    }
    if (paciente_id) {
      query += ` AND c.ID_Paciente = $${idx++}`;
      params.push(paciente_id);
    }
    if (estado) {
      query += ` AND c.Estado = $${idx++}`;
      params.push(estado);
    }
    if (fecha_desde) {
      query += ` AND c.Fecha_Hora >= $${idx++}`;
      params.push(fecha_desde);
    }
    if (fecha_hasta) {
      query += ` AND c.Fecha_Hora <= $${idx++}`;
      params.push(fecha_hasta);
    }

    query += ' ORDER BY c.Fecha_Hora DESC';

    const result = await pool.query(query, params);
    res.json(normalizeRows(result.rows));
  } catch (error) {
    console.error('Error al obtener citas:', error);
    res.status(500).json({ message: 'Error al obtener citas' });
  }
});

router.post('/', authenticateToken, async (req: any, res: any) => {
  const client = await pool.connect();
  try {
    const { ID_Paciente, ID_Medico, Fecha_Hora } = req.body;

    if (!ID_Paciente || !ID_Medico || !Fecha_Hora) {
      return res.status(400).json({ message: 'Paciente, médico y fecha/hora son requeridos' });
    }

    const fechaCita = new Date(Fecha_Hora);
    if (fechaCita < new Date()) {
      return res.status(400).json({ message: 'No se pueden programar citas en el pasado' });
    }

    await client.query('BEGIN');

    const conflicto = await client.query(
      `SELECT ID_Cita FROM Cita
       WHERE ID_Medico = $1 AND Estado NOT IN ('Cancelada')
         AND Fecha_Hora >= $2::timestamp - INTERVAL '20 minutes'
         AND Fecha_Hora <= $2::timestamp + INTERVAL '20 minutes'`,
      [ID_Medico, Fecha_Hora],
    );

    let estadoFinal = 'Pendiente';
    let citaAfectadaId = null;

    if (conflicto.rows.length > 0) {
      estadoFinal = 'En Espera';
    }

    const result = await client.query(
      `INSERT INTO Cita (ID_Paciente, ID_Medico, Fecha_Hora, Estado)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [ID_Paciente, ID_Medico, Fecha_Hora, estadoFinal],
    );

    const nuevaCita = normalizeRow(result.rows[0]);

    const medInfo = await client.query('SELECT ID_Usuario FROM Medico WHERE ID_Medico = $1', [ID_Medico]);
    const pacInfo = await client.query('SELECT ID_Usuario FROM Paciente WHERE ID_Paciente = $1', [ID_Paciente]);

    const io = req.app.get('io');
    if (io) {
      if (medInfo.rows.length > 0) {
        emitirNotificacionSistema(io, medInfo.rows[0].id_usuario, 'Nueva Cita', `Se ha programado una cita para el ${Fecha_Hora}`);
      }
      if (pacInfo.rows.length > 0) {
        emitirNotificacionSistema(io, pacInfo.rows[0].id_usuario, 'Cita Registrada', `Tu cita ha sido programada con estado: ${estadoFinal}`);
      }
    }

    await client.query('COMMIT');
    res.status(201).json({
      ...nuevaCita,
      aviso_conflicto: conflicto.rows.length > 0 ? 'Horario ocupado. Cita guardada en estado En Espera.' : null,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al crear cita:', error);
    res.status(500).json({ message: 'Error al crear la cita' });
  } finally {
    client.release();
  }
});

router.put('/:id/estado', authenticateToken, async (req: any, res: any) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { Estado } = req.body;

    const estadosValidos = ['Pendiente', 'En Espera', 'Cancelada', 'Reprogramada', 'Atendida'];
    if (!estadosValidos.includes(Estado)) {
      return res.status(400).json({ message: 'Estado inválido' });
    }

    await client.query('BEGIN');

    const result = await client.query(
      'UPDATE Cita SET Estado = $1 WHERE ID_Cita = $2 RETURNING *',
      [Estado, id],
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Cita no encontrada' });
    }

    const cita = result.rows[0];

    if (Estado === 'Cancelada') {
      const espera = await client.query(
        `SELECT ID_Cita FROM Cita WHERE ID_Medico = $1 AND Estado = 'En Espera' ORDER BY Fecha_Hora ASC LIMIT 1`,
        [cita.id_medico],
      );
      if (espera.rows.length > 0) {
        await client.query(`UPDATE Cita SET Estado = 'Pendiente' WHERE ID_Cita = $1`, [espera.rows[0].id_cita]);
      }
    }

    await client.query('COMMIT');
    res.json(normalizeRow(result.rows[0]));
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al actualizar estado de cita:', error);
    res.status(500).json({ message: 'Error al actualizar el estado de la cita' });
  } finally {
    client.release();
  }
});

export default router;
