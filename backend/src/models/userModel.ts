import pool from '../db';

export async function findUserByUsernameOrEmail(usernameCorreo: string) {
    const result = await pool.query(
        'SELECT u.*, r.Nombre_Rol FROM Usuario u JOIN Rol r ON u.ID_Rol = r.ID_Rol WHERE u.Username_Correo = $1 AND u.Estado_Activo = true',
        [usernameCorreo],
    );
    return result.rows[0] || null;
}

export async function findMedicoByUserId(userId: number) {
    const result = await pool.query(
        'SELECT ID_Medico, Nombres, Apellidos FROM Medico WHERE ID_Usuario = $1',
        [userId],
    );
    return result.rows[0] || null;
}

export async function findPacienteByUserId(userId: number) {
    const result = await pool.query(
        'SELECT ID_Paciente, Nombres, Apellidos FROM Paciente WHERE ID_Usuario = $1',
        [userId],
    );
    return result.rows[0] || null;
}
