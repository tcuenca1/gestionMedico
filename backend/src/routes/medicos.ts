import express from 'express';
import bcrypt from 'bcryptjs';
import pool from '../db';
import { authenticateToken, requireRole } from '../middleware/auth';
import { normalizeRow, normalizeRows } from '../utils/normalize-rows';

const router = express.Router();

router.get('/', authenticateToken, async (req: any, res: any) => {
  try {
    const result = await pool.query(
      `SELECT m.*, e.Nombre_Especialidad, u.Username_Correo, u.Estado_Activo
       FROM Medico m
       JOIN Especialidad e ON m.ID_Especialidad = e.ID_Especialidad
       JOIN Usuario u ON m.ID_Usuario = u.ID_Usuario
       ORDER BY m.ID_Medico ASC`,
    );
    res.json(normalizeRows(result.rows));
  } catch (error) {
    console.error('Error al obtener médicos:', error);
    res.status(500).json({ message: 'Error al obtener médicos' });
  }
});

router.get('/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT m.*, e.Nombre_Especialidad, u.Username_Correo, u.Estado_Activo
       FROM Medico m
       JOIN Especialidad e ON m.ID_Especialidad = e.ID_Especialidad
       JOIN Usuario u ON m.ID_Usuario = u.ID_Usuario
       WHERE m.ID_Medico = $1`,
      [id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Médico no encontrado' });
    }
    res.json(normalizeRow(result.rows[0]));
  } catch (error) {
    console.error('Error al obtener médico:', error);
    res.status(500).json({ message: 'Error al obtener médico' });
  }
});

router.post('/', authenticateToken, requireRole('Administrador'), async (req: any, res: any) => {
  const client = await pool.connect();
  try {
    const { Nombres, Apellidos, ID_Especialidad, Numero_Colegiatura, Username_Correo, Password } = req.body;

    if (!Nombres || !Apellidos || !ID_Especialidad || !Numero_Colegiatura || !Username_Correo || !Password) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    await client.query('BEGIN');

    const hashedPassword = await bcrypt.hash(Password, 10);

    const userResult = await client.query(
      `INSERT INTO Usuario (ID_Rol, Username_Correo, Password_Hash, Estado_Activo)
       VALUES ((SELECT ID_Rol FROM Rol WHERE Nombre_Rol = 'Médico'), $1, $2, true)
       RETURNING ID_Usuario`,
      [Username_Correo, hashedPassword],
    );

    const medicoResult = await client.query(
      `INSERT INTO Medico (ID_Usuario, ID_Especialidad, Nombres, Apellidos, Numero_Colegiatura)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [userResult.rows[0].id_usuario, ID_Especialidad, Nombres, Apellidos, Numero_Colegiatura],
    );

    await client.query('COMMIT');
    res.status(201).json(normalizeRow(medicoResult.rows[0]));
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al crear médico:', error);
    res.status(500).json({ message: 'Error al crear médico. Verifica que el correo o colegiatura no estén duplicados.' });
  } finally {
    client.release();
  }
});

router.put('/:id', authenticateToken, requireRole('Administrador'), async (req: any, res: any) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { Nombres, Apellidos, ID_Especialidad, Numero_Colegiatura, Username_Correo, Password } = req.body;

    await client.query('BEGIN');

    const result = await client.query(
      `UPDATE Medico SET Nombres = $1, Apellidos = $2, ID_Especialidad = $3, Numero_Colegiatura = $4
       WHERE ID_Medico = $5 RETURNING *`,
      [Nombres, Apellidos, ID_Especialidad, Numero_Colegiatura, id],
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Médico no encontrado' });
    }

    const userId = result.rows[0].id_usuario;

    if (Username_Correo) {
      await client.query('UPDATE Usuario SET Username_Correo = $1 WHERE ID_Usuario = $2', [Username_Correo, userId]);
    }

    if (Password && Password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(Password, 10);
      await client.query('UPDATE Usuario SET Password_Hash = $1 WHERE ID_Usuario = $2', [hashedPassword, userId]);
    }

    await client.query('COMMIT');
    res.json(normalizeRow(result.rows[0]));
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al actualizar médico:', error);
    res.status(500).json({ message: 'Error al actualizar médico' });
  } finally {
    client.release();
  }
});

router.delete('/:id', authenticateToken, requireRole('Administrador'), async (req: any, res: any) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    await client.query('BEGIN');

    const medResult = await client.query('SELECT ID_Usuario FROM Medico WHERE ID_Medico = $1', [id]);
    if (medResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Médico no encontrado' });
    }
    const userId = medResult.rows[0].id_usuario;

    await client.query('DELETE FROM Medico WHERE ID_Medico = $1', [id]);
    await client.query('DELETE FROM Usuario WHERE ID_Usuario = $1', [userId]);

    await client.query('COMMIT');
    res.json({ message: 'Médico eliminado correctamente' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al eliminar médico:', error);
    res.status(500).json({ message: 'Error al eliminar médico' });
  } finally {
    client.release();
  }
});

router.get('/:id/horarios', authenticateToken, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM Horario_Medico WHERE ID_Medico = $1 ORDER BY ID_Horario', [id]);
    res.json(normalizeRows(result.rows));
  } catch (error) {
    console.error('Error al obtener horarios:', error);
    res.status(500).json({ message: 'Error al obtener horarios' });
  }
});

router.post('/:id/horarios', authenticateToken, requireRole('Administrador'), async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { Dia_Semana, Hora_Inicio, Hora_Fin } = req.body;

    if (!Dia_Semana || !Hora_Inicio || !Hora_Fin) {
      return res.status(400).json({ message: 'Día, hora de inicio y hora de fin son requeridos' });
    }

    const result = await pool.query(
      `INSERT INTO Horario_Medico (ID_Medico, Dia_Semana, Hora_Inicio, Hora_Fin)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [id, Dia_Semana, Hora_Inicio, Hora_Fin],
    );
    res.status(201).json(normalizeRow(result.rows[0]));
  } catch (error) {
    console.error('Error al crear horario:', error);
    res.status(500).json({ message: 'Error al crear horario' });
  }
});

router.delete('/horarios/:idHorario', authenticateToken, requireRole('Administrador'), async (req: any, res: any) => {
  try {
    const { idHorario } = req.params;
    const result = await pool.query('DELETE FROM Horario_Medico WHERE ID_Horario = $1 RETURNING *', [idHorario]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Horario no encontrado' });
    }
    res.json({ message: 'Horario eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar horario:', error);
    res.status(500).json({ message: 'Error al eliminar horario' });
  }
});

export default router;
