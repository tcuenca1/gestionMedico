-- =========================================================================
-- SGMP - Sistema de Gestión Médica para Policlínicos
-- Script SQL Completo y Unificado para PostgreSQL / Railway
-- (Incluye Tablas, Índices, Triggers, Funciones de Auditoría y Datos Extendidos)
-- =========================================================================

-- 1. LIMPIEZA DE TABLAS Y FUNCIONES EXISTENTES (Orden inverso por dependencias)
DROP TRIGGER IF EXISTS trg_auditar_paciente ON Paciente;
DROP TRIGGER IF EXISTS trg_auditar_cita ON Cita;
DROP TRIGGER IF EXISTS trg_auditar_pago ON Pago;
DROP TRIGGER IF EXISTS trg_validar_fecha_nacimiento ON Paciente;
DROP TRIGGER IF EXISTS trg_validar_fecha_cita ON Cita;
DROP TRIGGER IF EXISTS trg_registrar_fecha_pago ON Pago;

DROP FUNCTION IF EXISTS fn_auditar_cambios();
DROP FUNCTION IF EXISTS fn_validar_fecha_nacimiento();
DROP FUNCTION IF EXISTS fn_validar_fecha_cita();
DROP FUNCTION IF EXISTS fn_registrar_fecha_pago();

DROP TABLE IF EXISTS Auditoria_Log CASCADE;
DROP TABLE IF EXISTS Log_Acceso_Sensible CASCADE;
DROP TABLE IF EXISTS Valor_Examen CASCADE;
DROP TABLE IF EXISTS Rango_Referencia CASCADE;
DROP TABLE IF EXISTS Examen CASCADE;
DROP TABLE IF EXISTS Mensaje CASCADE;
DROP TABLE IF EXISTS Conversacion CASCADE;
DROP TABLE IF EXISTS Pago CASCADE;
DROP TABLE IF EXISTS Receta_Medicamento CASCADE;
DROP TABLE IF EXISTS Signos_Vitales CASCADE;
DROP TABLE IF EXISTS Consulta_Medica CASCADE;
DROP TABLE IF EXISTS Cita CASCADE;
DROP TABLE IF EXISTS Horario_Medico CASCADE;
DROP TABLE IF EXISTS Paciente CASCADE;
DROP TABLE IF EXISTS Medico CASCADE;
DROP TABLE IF EXISTS Especialidad CASCADE;
DROP TABLE IF EXISTS Usuario CASCADE;
DROP TABLE IF EXISTS Rol CASCADE;

-- 2. CREACIÓN DE ESTRUCTURA DE TABLAS BASE
CREATE TABLE Rol (
    ID_Rol SERIAL PRIMARY KEY,
    Nombre_Rol VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE Usuario (
    ID_Usuario SERIAL PRIMARY KEY,
    ID_Rol INT NOT NULL,
    Username_Correo VARCHAR(100) NOT NULL UNIQUE,
    Password_Hash VARCHAR(255) NOT NULL,
    Estado_Activo BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (ID_Rol) REFERENCES Rol(ID_Rol) ON DELETE RESTRICT
);

CREATE TABLE Especialidad (
    ID_Especialidad SERIAL PRIMARY KEY,
    Nombre_Especialidad VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE Medico (
    ID_Medico SERIAL PRIMARY KEY,
    ID_Usuario INT NOT NULL UNIQUE,
    ID_Especialidad INT NOT NULL,
    Nombres VARCHAR(100) NOT NULL,
    Apellidos VARCHAR(100) NOT NULL,
    Numero_Colegiatura VARCHAR(20) UNIQUE NOT NULL,
    FOREIGN KEY (ID_Usuario) REFERENCES Usuario(ID_Usuario) ON DELETE CASCADE,
    FOREIGN KEY (ID_Especialidad) REFERENCES Especialidad(ID_Especialidad) ON DELETE RESTRICT
);

CREATE TABLE Paciente (
    ID_Paciente SERIAL PRIMARY KEY,
    ID_Usuario INT NOT NULL UNIQUE,
    DNI VARCHAR(15) UNIQUE NOT NULL,
    Nombres VARCHAR(100) NOT NULL,
    Apellidos VARCHAR(100) NOT NULL,
    Telefono VARCHAR(20),
    Fecha_Nacimiento DATE NOT NULL,
    FOREIGN KEY (ID_Usuario) REFERENCES Usuario(ID_Usuario) ON DELETE CASCADE
);

CREATE TABLE Horario_Medico (
    ID_Horario SERIAL PRIMARY KEY,
    ID_Medico INT NOT NULL,
    Dia_Semana VARCHAR(15) NOT NULL,
    Hora_Inicio TIME NOT NULL,
    Hora_Fin TIME NOT NULL,
    FOREIGN KEY (ID_Medico) REFERENCES Medico(ID_Medico) ON DELETE CASCADE
);

CREATE TABLE Cita (
    ID_Cita SERIAL PRIMARY KEY,
    ID_Paciente INT NOT NULL,
    ID_Medico INT NOT NULL,
    Fecha_Hora TIMESTAMP NOT NULL,
    Estado VARCHAR(20) DEFAULT 'Pendiente'
        CHECK (Estado IN ('Pendiente', 'En Espera', 'Cancelada', 'Reprogramada', 'Atendida')),
    FOREIGN KEY (ID_Paciente) REFERENCES Paciente(ID_Paciente) ON DELETE CASCADE,
    FOREIGN KEY (ID_Medico) REFERENCES Medico(ID_Medico) ON DELETE CASCADE
);

CREATE TABLE Consulta_Medica (
    ID_Consulta SERIAL PRIMARY KEY,
    ID_Cita INT NOT NULL UNIQUE,
    Motivo TEXT NOT NULL,
    Sintomas TEXT,
    Diagnostico_Notas TEXT NOT NULL,
    Tratamiento TEXT,
    Observaciones TEXT,
    Fecha_Registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ID_Cita) REFERENCES Cita(ID_Cita) ON DELETE CASCADE
);

CREATE TABLE Signos_Vitales (
    ID_Signo SERIAL PRIMARY KEY,
    ID_Consulta INT NOT NULL UNIQUE,
    Presion_Arterial VARCHAR(20),
    Frecuencia_Cardiaca INT,
    Temperatura DECIMAL(4,1),
    Peso DECIMAL(5,1),
    Estatura DECIMAL(4,1),
    Frecuencia_Respiratoria INT,
    Saturacion_Oxigeno INT,
    FOREIGN KEY (ID_Consulta) REFERENCES Consulta_Medica(ID_Consulta) ON DELETE CASCADE
);

CREATE TABLE Receta_Medicamento (
    ID_Receta SERIAL PRIMARY KEY,
    ID_Consulta INT NOT NULL,
    Medicamento VARCHAR(200) NOT NULL,
    Dosis VARCHAR(100) NOT NULL,
    Frecuencia VARCHAR(100) NOT NULL,
    Duracion VARCHAR(100),
    FOREIGN KEY (ID_Consulta) REFERENCES Consulta_Medica(ID_Consulta) ON DELETE CASCADE
);

CREATE TABLE Pago (
    ID_Pago SERIAL PRIMARY KEY,
    ID_Consulta INT NOT NULL UNIQUE,
    Monto NUMERIC(10, 2) NOT NULL CHECK (Monto >= 0),
    Fecha_Pago TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Estado_Pago VARCHAR(20) DEFAULT 'Completado'
        CHECK (Estado_Pago IN ('Pendiente', 'Completado', 'Anulado')),
    FOREIGN KEY (ID_Consulta) REFERENCES Consulta_Medica(ID_Consulta) ON DELETE RESTRICT
);

-- 3. MÓDULO DE CHAT
CREATE TABLE Conversacion (
    ID_Conversacion SERIAL PRIMARY KEY,
    ID_Usuario_1 INTEGER NOT NULL REFERENCES Usuario(ID_Usuario),
    ID_Usuario_2 INTEGER NOT NULL REFERENCES Usuario(ID_Usuario),
    Creado_En TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (ID_Usuario_1 < ID_Usuario_2),
    UNIQUE(ID_Usuario_1, ID_Usuario_2)
);

CREATE TABLE Mensaje (
    ID_Mensaje SERIAL PRIMARY KEY,
    ID_Conversacion INTEGER NOT NULL REFERENCES Conversacion(ID_Conversacion) ON DELETE CASCADE,
    Remitente_ID INTEGER REFERENCES Usuario(ID_Usuario),
    Contenido TEXT NOT NULL,
    Tipo VARCHAR(10) DEFAULT 'texto' CHECK (Tipo IN ('texto', 'sistema')),
    Leido BOOLEAN DEFAULT FALSE,
    Creado_En TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_mensaje_conversacion ON Mensaje(ID_Conversacion, Creado_En DESC);
CREATE INDEX idx_mensaje_no_leido ON Mensaje(ID_Conversacion, Remitente_ID, Leido);

-- 4. MÓDULO DE EXÁMENES DE LABORATORIO Y AUDITORÍA
CREATE TABLE Examen (
    ID_Examen SERIAL PRIMARY KEY,
    ID_Paciente INT NOT NULL,
    ID_Consulta INT,
    Archivo_Nombre VARCHAR(255) NOT NULL,
    Archivo_Ruta VARCHAR(500) NOT NULL,
    Archivo_Tipo VARCHAR(50) NOT NULL,
    Archivo_Tamanio INT NOT NULL,
    Texto_OCR TEXT,
    Resumen_Medico TEXT,
    Resumen_Paciente TEXT,
    Laboratorio VARCHAR(200),
    Fecha_Toma DATE,
    Fecha_Subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Notas_Clinicas TEXT,
    Tipo_Examen VARCHAR(50) NOT NULL,
    Etiquetas TEXT[] DEFAULT '{}',
    Es_Sensible BOOLEAN DEFAULT FALSE,
    Estado_Alerta VARCHAR(20) DEFAULT 'normal'
        CHECK (Estado_Alerta IN ('normal', 'borderline', 'critico')),
    Subido_Por INT NOT NULL,
    Tiene_Valores BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (ID_Paciente) REFERENCES Paciente(ID_Paciente) ON DELETE CASCADE,
    FOREIGN KEY (ID_Consulta) REFERENCES Consulta_Medica(ID_Consulta) ON DELETE SET NULL,
    FOREIGN KEY (Subido_Por) REFERENCES Usuario(ID_Usuario) ON DELETE RESTRICT
);

CREATE TABLE Valor_Examen (
    ID_Valor SERIAL PRIMARY KEY,
    ID_Examen INT NOT NULL,
    Nombre_Valor VARCHAR(100) NOT NULL,
    Valor_Numerico NUMERIC(12, 4),
    Valor_Texto VARCHAR(500),
    Unidad VARCHAR(50),
    Rango_Minimo NUMERIC(12, 4),
    Rango_Maximo NUMERIC(12, 4),
    Estado VARCHAR(20) DEFAULT 'normal'
        CHECK (Estado IN ('normal', 'alterado', 'critico')),
    FOREIGN KEY (ID_Examen) REFERENCES Examen(ID_Examen) ON DELETE CASCADE
);

CREATE TABLE Log_Acceso_Sensible (
    ID_Log SERIAL PRIMARY KEY,
    ID_Examen INT NOT NULL,
    ID_Usuario INT NOT NULL,
    Fecha_Acceso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    IP VARCHAR(45),
    FOREIGN KEY (ID_Examen) REFERENCES Examen(ID_Examen) ON DELETE CASCADE,
    FOREIGN KEY (ID_Usuario) REFERENCES Usuario(ID_Usuario) ON DELETE RESTRICT
);

CREATE TABLE Rango_Referencia (
    ID_Rango SERIAL PRIMARY KEY,
    Nombre_Valor VARCHAR(100) NOT NULL,
    Unidad VARCHAR(50),
    Rango_Minimo NUMERIC(12, 4) NOT NULL,
    Rango_Maximo NUMERIC(12, 4) NOT NULL,
    Limite_Critico_Inferior NUMERIC(12, 4),
    Limite_Critico_Superior NUMERIC(12, 4),
    Activo BOOLEAN DEFAULT TRUE
);

-- Tabla de Auditoría general para cambios en tablas sensibles
CREATE TABLE Auditoria_Log (
    ID_Auditoria SERIAL PRIMARY KEY,
    Tabla_Afectada VARCHAR(100) NOT NULL,
    Operacion VARCHAR(10) NOT NULL CHECK (Operacion IN ('INSERT', 'UPDATE', 'DELETE')),
    ID_Registro INT,
    ID_Usuario INT,
    Datos_Anteriores JSONB,
    Datos_Nuevos JSONB,
    Fecha_Acceso TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- 5. FUNCIONES Y TRIGGERS DE VALIDACIÓN, NEGOCIO Y AUDITORÍA
-- =========================================================================

-- A. Función para validar fecha de nacimiento
CREATE OR REPLACE FUNCTION fn_validar_fecha_nacimiento()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.Fecha_Nacimiento > CURRENT_DATE THEN
        RAISE EXCEPTION 'La fecha de nacimiento no puede ser posterior a la fecha actual.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validar_fecha_nacimiento
BEFORE INSERT OR UPDATE ON Paciente
FOR EACH ROW
EXECUTE FUNCTION fn_validar_fecha_nacimiento();

-- B. Función para validar que no se creen citas en el pasado
CREATE OR REPLACE FUNCTION fn_validar_fecha_cita()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.Fecha_Hora < CURRENT_TIMESTAMP THEN
        RAISE EXCEPTION 'No se pueden programar citas en el pasado.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validar_fecha_cita
BEFORE INSERT ON Cita
FOR EACH ROW
EXECUTE FUNCTION fn_validar_fecha_cita();

-- C. Función para registrar fecha de pago
CREATE OR REPLACE FUNCTION fn_registrar_fecha_pago()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.Estado_Pago = 'Completado' AND (OLD.Estado_Pago IS NULL OR OLD.Estado_Pago != 'Completado') THEN
        NEW.Fecha_Pago = CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_registrar_fecha_pago
BEFORE INSERT OR UPDATE ON Pago
FOR EACH ROW
EXECUTE FUNCTION fn_registrar_fecha_pago();

-- D. Función y Triggers de Auditoría Automática
CREATE OR REPLACE FUNCTION fn_auditar_cambios()
RETURNS TRIGGER AS $$
DECLARE
    v_id INT;
BEGIN
    IF (TG_OP = 'INSERT') THEN
        v_id := COALESCE(NEW.id_paciente, NEW.id_cita, NEW.id_pago, NEW.id_usuario, NEW.id_medico, 0);
        INSERT INTO Auditoria_Log (Tabla_Afectada, Operacion, ID_Registro, Datos_Nuevos)
        VALUES (TG_TABLE_NAME, 'INSERT', v_id, to_jsonb(NEW));
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        v_id := COALESCE(NEW.id_paciente, NEW.id_cita, NEW.id_pago, NEW.id_usuario, NEW.id_medico, 0);
        INSERT INTO Auditoria_Log (Tabla_Afectada, Operacion, ID_Registro, Datos_Anteriores, Datos_Nuevos)
        VALUES (TG_TABLE_NAME, 'UPDATE', v_id, to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        v_id := COALESCE(OLD.id_paciente, OLD.id_cita, OLD.id_pago, OLD.id_usuario, OLD.id_medico, 0);
        INSERT INTO Auditoria_Log (Tabla_Afectada, Operacion, ID_Registro, Datos_Anteriores)
        VALUES (TG_TABLE_NAME, 'DELETE', v_id, to_jsonb(OLD));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auditar_paciente
AFTER INSERT OR UPDATE OR DELETE ON Paciente
FOR EACH ROW EXECUTE FUNCTION fn_auditar_cambios();

CREATE TRIGGER trg_auditar_cita
AFTER INSERT OR UPDATE OR DELETE ON Cita
FOR EACH ROW EXECUTE FUNCTION fn_auditar_cambios();

CREATE TRIGGER trg_auditar_pago
AFTER INSERT OR UPDATE OR DELETE ON Pago
FOR EACH ROW EXECUTE FUNCTION fn_auditar_cambios();


-- =========================================================================
-- 6. DATOS INICIALES (Seed Data Extendido)
-- =========================================================================
INSERT INTO Rol (Nombre_Rol) VALUES ('Administrador');
INSERT INTO Rol (Nombre_Rol) VALUES ('Recepcionista');
INSERT INTO Rol (Nombre_Rol) VALUES ('Médico');
INSERT INTO Rol (Nombre_Rol) VALUES ('Paciente');

INSERT INTO Especialidad (Nombre_Especialidad) VALUES ('Medicina General');
INSERT INTO Especialidad (Nombre_Especialidad) VALUES ('Cardiología');
INSERT INTO Especialidad (Nombre_Especialidad) VALUES ('Pediatría');
INSERT INTO Especialidad (Nombre_Especialidad) VALUES ('Ginecología');
INSERT INTO Especialidad (Nombre_Especialidad) VALUES ('Dermatología');
INSERT INTO Especialidad (Nombre_Especialidad) VALUES ('Traumatología');
INSERT INTO Especialidad (Nombre_Especialidad) VALUES ('Oftalmología');
INSERT INTO Especialidad (Nombre_Especialidad) VALUES ('Neurología');

-- Usuarios por defecto
INSERT INTO Usuario (ID_Rol, Username_Correo, Password_Hash, Estado_Activo)
VALUES 
(1, 'admin@sgmp.com', '$2b$10$DW25pjba54e6kg/A67yOAu2jJT9t6H04V0vfM4uI21WVZkDiikEwK', true),
(2, 'recepcion@sgmp.com', '$2b$10$ShjxAE4rXy42AJvJ.zdd4uMvfzGBAeFOnNNZVjaNu/LF.WkZ2Yjgi', true),
(3, 'dr.paredes@sgmp.com', '$2b$10$ZhpJxcUekfpQBbmZmpt3zOwEjOnsngYXWBW9SOw6U8AQh9YOhEO6K', true),
(3, 'dra.lopez@sgmp.com', '$2b$10$FG2IBuDZjmOmR2RhweG19O7jO5467piPQur1bbpIlmJr.FOx.0Mze', true),
(3, 'dr.gomez@sgmp.com', '$2b$10$ZhpJxcUekfpQBbmZmpt3zOwEjOnsngYXWBW9SOw6U8AQh9YOhEO6K', true),
(4, '1100123456', '$2b$10$0YWwk9/MRNJ.D9Gu5Xff1.XMw0l6fsGArLXshgwdzcY9zi7bOtcVS', true),
(4, '1100789012', '$2b$10$0YWwk9/MRNJ.D9Gu5Xff1.XMw0l6fsGArLXshgwdzcY9zi7bOtcVS', true),
(4, '1100345678', '$2b$10$0YWwk9/MRNJ.D9Gu5Xff1.XMw0l6fsGArLXshgwdzcY9zi7bOtcVS', true);

INSERT INTO Medico (ID_Usuario, ID_Especialidad, Nombres, Apellidos, Numero_Colegiatura)
VALUES 
(3, 1, 'Carlos', 'Paredes Molina', 'COL-12345'),
(4, 2, 'María', 'López García', 'COL-12346'),
(5, 3, 'Roberto', 'Gómez Bolaños', 'COL-12347');

INSERT INTO Paciente (ID_Usuario, DNI, Nombres, Apellidos, Telefono, Fecha_Nacimiento)
VALUES 
(6, '1100123456', 'Juan', 'Pérez Ramírez', '0999123456', '1990-05-15'),
(7, '1100789012', 'Ana', 'Jiménez Torres', '0999789012', '1985-08-22'),
(8, '1100345678', 'Luis', 'Martínez Silva', '0999345678', '1995-12-10');

INSERT INTO Horario_Medico (ID_Medico, Dia_Semana, Hora_Inicio, Hora_Fin)
VALUES 
(1, 'Lunes', '08:00', '12:00'),
(1, 'Miércoles', '08:00', '12:00'),
(2, 'Martes', '08:00', '12:00'),
(3, 'Viernes', '14:00', '18:00');

INSERT INTO Cita (ID_Paciente, ID_Medico, Fecha_Hora, Estado)
VALUES 
(1, 1, NOW() + INTERVAL '1 hour', 'Pendiente'),
(2, 2, NOW() + INTERVAL '2 hours', 'Pendiente'),
(3, 3, NOW() + INTERVAL '3 hours', 'Pendiente'),
(1, 1, NOW() + INTERVAL '1 day', 'Pendiente');

-- Rangos de referencia de exámenes por defecto
INSERT INTO Rango_Referencia (Nombre_Valor, Unidad, Rango_Minimo, Rango_Maximo, Limite_Critico_Inferior, Limite_Critico_Superior) VALUES
('Glucosa', 'mg/dL', 70, 100, 54, 200),
('Hemoglobina', 'g/dL', 13.5, 17.5, 8, 20),
('Hematocrito', '%', 38.3, 48.6, 20, 60),
('Leucocitos', '/mm³', 4500, 11000, 2000, 20000),
('Plaquetas', '/mm³', 150000, 450000, 50000, 700000),
('Colesterol Total', 'mg/dL', 125, 200, null, 300),
('Colesterol HDL', 'mg/dL', 40, 60, null, null),
('Colesterol LDL', 'mg/dL', 0, 100, null, 190),
('Triglicéridos', 'mg/dL', 0, 150, null, 400),
('Creatinina', 'mg/dL', 0.6, 1.2, null, 3),
('Urea', 'mg/dL', 10, 50, null, 100),
('Ácido Úrico', 'mg/dL', 3.5, 7.2, null, 10),
('TSH', 'mIU/L', 0.4, 4.5, null, 10),
('T4 Libre', 'ng/dL', 0.8, 1.8, null, null),
('ALT', 'U/L', 7, 56, null, 150),
('AST', 'U/L', 10, 40, null, 150),
('GGT', 'U/L', 9, 48, null, 100),
('Bilirrubina Total', 'mg/dL', 0.1, 1.2, null, 5),
('Proteína C Reactiva', 'mg/L', 0, 5, null, 20),
('Potasio', 'mEq/L', 3.5, 5.1, 2.5, 6.5),
('Sodio', 'mEq/L', 136, 145, 120, 155),
('Calcio', 'mg/dL', 8.5, 10.5, 7, 12),
('Ácido Láctico', 'mmol/L', 0.5, 2.2, null, null),
('Vitamina D', 'ng/mL', 20, 50, null, null);
