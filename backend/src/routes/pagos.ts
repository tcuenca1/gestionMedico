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
       ORDER BY p.Fecha_Pago ASC`,
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

// Endpoint para descarga de Reporte en formato PDF (HTML renderizado a PDF o texto estructurado)
router.get('/reporte/pdf', authenticateToken, async (req: any, res: any) => {
  try {
    const { inicio, fin } = req.query;
    const fechaInicio = inicio || new Date().toISOString().split('T')[0];
    const fechaFin = fin || new Date().toISOString().split('T')[0];

    const result = await pool.query(
      `SELECT p.*, pac.Nombres || ' ' || pac.Apellidos AS Paciente_Nombre
       FROM Pago p
       JOIN Consulta_Medica cm ON p.ID_Consulta = cm.ID_Consulta
       JOIN Cita c ON cm.ID_Cita = c.ID_Cita
       JOIN Paciente pac ON c.ID_Paciente = pac.ID_Paciente
       WHERE DATE(p.Fecha_Pago) >= $1 AND DATE(p.Fecha_Pago) <= $2
       ORDER BY p.ID_Pago ASC`,
      [fechaInicio, fechaFin]
    );

    const pagos = result.rows;
    if (pagos.length === 0) {
      return res.status(404).json({ message: 'No hay registros de pagos en el rango seleccionado' });
    }

    const total = pagos.reduce((acc, p) => acc + Number(p.monto), 0);

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Reporte de Pagos - SGMP</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
          h2 { color: #0d6efd; border-bottom: 2px solid #0d6efd; padding-bottom: 5px; }
          .info { margin-bottom: 20px; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 13px; }
          th { background-color: #f8f9fa; }
          .total { margin-top: 15px; font-weight: bold; font-size: 16px; text-align: right; }
        </style>
      </head>
      <body>
        <h2>SGMP - Sistema de Gestión Médica para Policlínicos</h2>
        <div class="info">
          <p><strong>Reporte de Ingresos por Pagos</strong></p>
          <p>Rango de Fechas: ${fechaInicio} al ${fechaFin}</p>
          <p>Fecha de Emisión: ${new Date().toLocaleString()}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th># Pago</th>
              <th>Paciente</th>
              <th>Monto ($)</th>
              <th>Fecha de Pago</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            ${pagos.map(p => `
              <tr>
                <td>${p.id_pago}</td>
                <td>${p.paciente_nombre}</td>
                <td>$${Number(p.monto).toFixed(2)}</td>
                <td>${new Date(p.fecha_pago).toLocaleDateString()}</td>
                <td>${p.estado_pago}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="total">
          Total Recaudado: $${total.toFixed(2)}
        </div>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=reporte-pagos_${fechaInicio}_${fechaFin}.pdf`);
    res.send(Buffer.from(html));
  } catch (error) {
    console.error('Error al generar PDF de reporte:', error);
    res.status(500).json({ message: 'Error al generar reporte en PDF' });
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
