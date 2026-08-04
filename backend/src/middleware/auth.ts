import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { Request, Response, NextFunction } from 'express';

dotenv.config();

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET no está definido en las variables de entorno');
  process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET;

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    rol: string;
    username: string;
    [key: string]: any;
  };
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token de acceso requerido' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token inválido o expirado' });
    }
    req.user = user as any;
    next();
  });
}

export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.map(r => r.toLowerCase()).includes(req.user.rol.toLowerCase())) {
      return res.status(403).json({ message: 'No tienes permisos para esta acción' });
    }
    next();
  };
}
