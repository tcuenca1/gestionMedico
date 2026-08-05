import express from 'express';
import bcrypt from 'bcryptjs';
import pool from '../db';
import { authenticateToken } from '../middleware/auth';
import { normalizeRow, normalizeRows } from '../utils/normalize-rows';

const router = express.Router();

router.get('/', authenticateToken, async (req: any, res: any) => {
  try {
    const result = await pool.query('SELECT * FROM Paciente ORDER BY ID_Paciente ASC');
    res.json(normalizeRows(result.rows));
  } catch (error) {
    console.error('Error al obtener pacientes:', error);
    res.status(500).json({ message: 'Error al obtener pacientes' });
  }
});

router.get('/buscar/:term', authenticateToken, async (req: any, res: any) => {
  try {
    const { term } = req.params;
    const result = await pool.query(
      `SELECT * FROM Paciente
       WHERE DNI ILIKE $1 OR Nombres ILIKE $1 OR Apellidos ILIKE $1 OR ID_Paciente::text ILIKE $1
       ORDER BY Apellidos
       LIMIT 20`,
      [`%${term}%`],
    );
    res.json(normalizeRows(result.rows));
  } catch (error) {
    console.error('Error al buscar pacientes:', error);
    res.status(500).json({ message: 'Error al buscar pacientes' });
  }
});

router.get('/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM Paciente WHERE ID_Paciente = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Paciente no encontrado' });
    }
    res.json(normalizeRow(result.rows[0]));
  } catch (error) {
    console.error('Error al obtener paciente:', error);
    res.status(500).json({ message: 'Error al obtener paciente' });
  }
});

router.post('/', authenticateToken, async (req: any, res: any) => {
  const client = await pool.connect();
  try {
    const { DNI, Nombres, Apellidos, Telefono, Fecha_Nacimiento } = req.body;

    if (new Date(Fecha_Nacimiento) > new Date()) {
      return res.status(400).json({ message: 'La fecha de nacimiento no puede ser posterior a la fecha actual' });
    }

    await client.query('BEGIN');

    const hashedPassword = await bcrypt.hash(DNI, 10);

    const userResult = await client.query(
      `INSERT INTO Usuario (ID_Rol, Username_Correo, Password_Hash, Estado_Activo)
       VALUES ((SELECT ID_Rol FROM Rol WHERE Nombre_Rol = 'Paciente'), $1, $2, true)
       RETURNING ID_Usuario`,
      [DNI, hashedPassword],
    );

    const pacienteResult = await client.query(
      `INSERT INTO Paciente (ID_Usuario, DNI, Nombres, Apellidos, Telefono, Fecha_Nacimiento)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userResult.rows[0].id_usuario, DNI, Nombres, Apellidos, Telefono, Fecha_Nacimiento],
    );

    await client.query('COMMIT');
    res.status(201).json(normalizeRow(pacienteResult.rows[0]));
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al crear paciente:', error);
    res.status(500).json({ message: 'Error al crear paciente. Verifica que el DNI no esté duplicado.' });
  } finally {
    client.release();
  }
});

router.put('/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { DNI, Nombres, Apellidos, Telefono, Fecha_Nacimiento } = req.body;

    if (new Date(Fecha_Nacimiento) > new Date()) {
      return res.status(400).json({ message: 'La fecha de nacimiento no puede ser posterior a la fecha actual' });
    }

    const result = await pool.query(
      `UPDATE Paciente SET DNI = $1, Nombres = $2, Apellidos = $3, Telefono = $4, Fecha_Nacimiento = $5
       WHERE ID_Paciente = $6 RETURNING *`,
      [DNI, Nombres, Apellidos, Telefono, Fecha_Nacimiento, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Paciente no encontrado' });
    }

    res.json(normalizeRow(result.rows[0]));
  } catch (error) {
    console.error('Error al actualizar paciente:', error);
    res.status(500).json({ message: 'Error al actualizar paciente' });
  }
});

router.delete('/:id', authenticateToken, async (req: any, res: any) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    await client.query('BEGIN');

    const pacResult = await client.query('SELECT ID_Usuario FROM Paciente WHERE ID_Paciente = $1', [id]);
    if (pacResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Paciente no encontrado' });
    }
    const userId = pacResult.rows[0].id_usuario;

    await client.query('DELETE FROM Paciente WHERE ID_Paciente = $1', [id]);
    if (userId) {
      await client.query('DELETE FROM Usuario WHERE ID_Usuario = $1', [userId]);
    }

    await client.query('COMMIT');
    res.json({ message: 'Paciente eliminado correctamente' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al eliminar paciente:', error);
    res.status(500).json({ message: 'Error al eliminar paciente' });
  } finally {
    client.release();
  }
});

export default router;
