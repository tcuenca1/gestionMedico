import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';

import authRoutes from './routes/auth';

const app = express();

app.use(helmet({ frameguard: false }));
app.disable('x-powered-by');
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'SGMP API funcionando' });
});

app.use('/api/auth', authRoutes);
app.use('/api/medicos', (req, res) => res.json([]));
app.use('/api/pacientes', (req, res) => res.json([]));
app.use('/api/especialidades', (req, res) => res.json([]));
app.use('/api/citas', (req, res) => res.json([]));
app.use('/api/consultas', (req, res) => res.json([]));
app.use('/api/pagos', (req, res) => res.json([]));
app.use('/api/dashboard', (req, res) => res.json([]));
app.use('/api/examenes', (req, res) => res.json([]));
app.use('/api/chat', (req, res) => res.json([]));

app.use((err: any, req: any, res: any, next: any) => {
  console.error('Error no controlado:', err);
  res.status(500).json({ message: 'Error interno del servidor' });
});

export default app;
