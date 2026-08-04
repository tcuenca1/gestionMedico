import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { findUserByUsernameOrEmail, findMedicoByUserId, findPacienteByUserId } from '../models/userModel';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export async function loginService(usernameCorreo: string, password: string) {
    if (!usernameCorreo || !password) {
        throw new Error('Usuario y contraseña son requeridos');
    }

    const usuario = await findUserByUsernameOrEmail(usernameCorreo);
    if (!usuario) {
        throw new Error('Credenciales inválidas');
    }

    const passwordMatch = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordMatch) {
        throw new Error('Credenciales inválidas');
    }

    const token = jwt.sign(
        {
            id: usuario.id_usuario,
            rol: usuario.nombre_rol,
            username: usuario.username_correo,
        },
        JWT_SECRET,
        { expiresIn: '10h' },
    );

    let nombreCompleto = '';
    let idMedico = null;

    if (usuario.nombre_rol === 'Médico' || usuario.nombre_rol === 'Medico') {
        const medico = await findMedicoByUserId(usuario.id_usuario);
        if (medico) {
            idMedico = medico.id_medico;
            nombreCompleto = `${medico.nombres} ${medico.apellidos}`;
        }
    } else if (usuario.nombre_rol === 'Paciente') {
        const paciente = await findPacienteByUserId(usuario.id_usuario);
        if (paciente) {
            nombreCompleto = `${paciente.nombres} ${paciente.apellidos}`;
        }
    }

    if (!nombreCompleto) {
        nombreCompleto = usuario.username_correo;
    }

    return {
        token,
        usuario: {
            ID_Usuario: usuario.id_usuario,
            ID_Rol: usuario.id_rol,
            Username_Correo: usuario.username_correo,
            Estado_Activo: usuario.estado_activo,
        },
        nombreCompleto,
        rol: usuario.nombre_rol,
        idMedico,
    };
}
