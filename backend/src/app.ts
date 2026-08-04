import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';

import authRoutes from './routes/auth';
import medicosRoutes from './routes/medicos';
import pacientesRoutes from './routes/pacientes';
import especialidadesRoutes from './routes/especialidades';
import citasRoutes from './routes/citas';
import consultasRoutes from './routes/consultas';
import pagosRoutes from './routes/pagos';
import dashboardRoutes from './routes/dashboard';
import examenesRoutes from './routes/examenes';
import chatRoutes from './routes/chat';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();

app.use(helmet({ frameguard: false }));
app.disable('x-powered-by');
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'SGMP API funcionando' });
});

app.use('/api/auth', authRoutes);
app.use('/api/medicos', medicosRoutes);
app.use('/api/pacientes', pacientesRoutes);
app.use('/api/especialidades', especialidadesRoutes);
app.use('/api/citas', citasRoutes);
app.use('/api/consultas', consultasRoutes);
app.use('/api/pagos', pagosRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/examenes', examenesRoutes);
app.use('/api/chat', chatRoutes);

app.use((err: any, req: any, res: any, next: any) => {
  console.error('Error no controlado:', err);
  res.status(500).json({ message: 'Error interno del servidor' });
});

export default app;
