import { Request, Response } from 'express';
import { loginService } from '../services/authService';

export async function loginController(req: Request, res: Response) {
    try {
        const { Username_Correo, Password } = req.body;
        const resultado = await loginService(Username_Correo, Password);
        return res.json(resultado);
    } catch (error: any) {
        console.error('Error en login:', error);
        if (error.message === 'Usuario y contraseña son requeridos') {
            return res.status(400).json({ message: error.message });
        }
        if (error.message === 'Credenciales inválidas') {
            return res.status(401).json({ message: error.message });
        }
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
}
